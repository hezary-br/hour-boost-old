import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { saferAsync } from "@hourboost/utils"
import { Fail, GetResult, PlanAllNames } from "core"
import express, { Router } from "express"
import { Stripe } from "stripe"
import { custom, z } from "zod"
import { ALS_username, ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { env } from "~/env"
import { prisma } from "~/infra/libs"
import { stripe } from "~/infra/services/stripe"
import { validateBody } from "~/inline-middlewares/validate-payload"
import { changeUserPlanUseCase, purchaseNewPlanController, usersRepository } from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import { Subscription } from "~/presentation/routes/stripe/Subscription"
import {
  createStripeCustomer,
  createSubscriptionStripe,
  getStripeCustomerByEmail,
  getStripeSubscriptions,
} from "~/presentation/routes/stripe/methods"
import {
  appStripePlansPlanNameKey,
  appStripePlansPriceIdKey as mapPlanNameByStripePriceIdKey,
} from "~/presentation/routes/stripe/plans"
import { upsertActualSubscription } from "~/presentation/routes/stripe/utils"
import { bad, nice, only } from "~/utils/helpers"

export const router_checkout: Router = Router()
export const router_webhook: Router = Router()

export type StripeSubscriptions = Stripe.Response<Stripe.ApiList<Stripe.Subscription>>

router_webhook.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const body = req.body
  const signature = req.headers["stripe-signature"] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_SECRET_WEBHOOK)
  } catch (error: any) {
    ctxLog(`Webhook Error: ${error.message}`)
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      console.log("Handling webhook event: ", event.type)
      const stripeCustomerId = event.data.object.customer as string
      const id_subscription = event.data.object.id as string
      const stripeStatus = event.data.object.status
      const stripePriceId = event.data.object.items.data[0].price.id
      let { user_email } = event.data.object.metadata

      if (!user_email) {
        const customer = await getStripeCustomerById(stripeCustomerId)
        if (!customer?.email) {
          console.log("NSTH: There is no user email, neither on the customer Id, and the metadata.")
          return res.sendStatus(500)
        }
        user_email = customer.email
      }

      const user = await usersRepository.getByEmail(user_email)
      if (!user) return res.sendStatus(404)
      await ALS_username.run(user.username, async () => {
        const [errorUpserting, actualSubscription] = await upsertActualSubscription({
          id_subscription,
          stripeCustomerId,
          stripePriceId,
          stripeStatus,
          user_email,
        })

        if (errorUpserting) {
          ctxLog(errorUpserting)
          return res.sendStatus(errorUpserting.httpStatus)
        }

        const newPlanName = mapPlanNameByStripePriceIdKey[stripePriceId]

        const [errorChangingPlan] = await changeUserPlanUseCase.execute({
          newPlanName,
          user,
        })

        if (errorChangingPlan) {
          ctxLog(errorChangingPlan)
          return res.sendStatus(errorChangingPlan.httpStatus)
        }

        if (!actualSubscription.user) {
          console.log(
            "NSTH: Webhook received and tried to update user subscription of a user that was not found.",
            {
              user_email,
              actualSubscription,
              user,
            }
          )
          return res.sendStatus(404)
        }
      })
      break
    default:
  }

  return res.sendStatus(200)
})

router_checkout.delete("/subscription/notification/:subscriptionNotificationId", async (req, res) => {
  const { subscriptionNotificationId } = req.params

  await prisma.subscriptionApprovedNotification.delete({
    where: { id_subscription: subscriptionNotificationId },
  })

  return res.status(200).json({ code: "DELETED-SUCCESSFULLY" })
})

router_checkout.get("/subscription/notification/:subscriptionNotificationId", async (req, res) => {
  const { subscriptionNotificationId } = req.params

  const subscriptionApprovedNotification = await prisma.subscriptionApprovedNotification.findUnique({
    where: { id_subscription: subscriptionNotificationId },
  })

  return res.status(200).json(subscriptionApprovedNotification)
})

router_checkout.post("/plan/preapproval", ClerkExpressRequireAuth(), async (req, res) => {
  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      userId: z.string().min(1, "Informe o ID do usuário."),
      email: z.string().email("Informe um e-mail válido."),
      planName: z.enum(["DIAMOND", "GOLD", "GUEST", "SILVER"], {
        message: "Tipo de plano inválido.",
      }),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { planName, userId, email } = body

  const presentation = await purchaseNewPlanController.handle({ planName, userId, email })
  return RequestHandlerPresenter.handle(presentation, res)
})

type CreateSubscriptionCheckoutSessionByEmailProps = {
  email: string
  userId: string
  name: string
  planName: PlanAllNames
}

export async function createSubscriptionCheckoutSessionByEmail({
  email,
  planName,
  userId,
  name,
}: CreateSubscriptionCheckoutSessionByEmailProps) {
  const [error, customer] = await getOrCreateCustomer({ email, name })
  if(error) return bad(error)

  const { url } = await createSubscriptionCheckoutSession({
    customerId: customer.id,
    planName,
    userId,
    email,
  })

  return nice({ url })
}

async function getStripeCustomerById(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return customer
}

type CreateCustomerProps = {
  email: string
  name: string
}

export async function getOrCreateCustomer({ email, name }: CreateCustomerProps) {
  const customersWithThisEmail = await getStripeCustomerByEmail(stripe, { email })
  if (customersWithThisEmail) return nice(customersWithThisEmail)

  const [error, customerCreated] = await createStripeCustomer(stripe, { email, name })
  if (error) return bad(error)
  if (!customerCreated.email) throw new Error("Customer with no email.")
  return nice({ ...customerCreated, email: customerCreated.email })
}

export type StripeCustomer = GetResult<typeof getOrCreateCustomer>

export async function updateUserDatabaseSubscription(subscription: Subscription) {
  return await prisma.subscriptionStripe.upsert({
    where: {
      user_email: subscription.email,
    },
    create: {
      updatedAt: new Date(),
      createdAt: new Date(),
      id_subscription: subscription.id,
      user_email: subscription.email,
      stripeStatus: subscription.status,
      stripeCustomerId: subscription.customerId,
      stripePriceId: subscription.priceId,
    },
    update: {
      updatedAt: new Date(),
      user_email: subscription.email,
      stripeStatus: subscription.status,
      stripeCustomerId: subscription.customerId,
      stripePriceId: subscription.priceId,
    },
  })
}

export async function makeStripeSubcription(customer: StripeCustomer) {
  const [error, subscriptionStripe] = await createSubscriptionStripe(stripe, {
    customerId: customer.id,
    planName: "GUEST",
  })
  if (error) return bad(error)

  const subscription = new Subscription({
    id: subscriptionStripe.id,
    customerId: customer.id,
    priceId: env.STRIPE_SUBSCRIPTIONS_PLAN_ID_GUEST,
    status: subscriptionStripe.status,
    email: customer.email,
  })

  await updateUserDatabaseSubscription(subscription)
  return {
    subscriptionStripe: subscriptionStripe,
    subscription,
  }
}

export async function getStripeCurrentSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  })

  return subs.data[0] ?? null
}

function extractCurrentSubscriptionOrNull(subscriptions: StripeSubscriptions) {
  const foundSubscription = subscriptions.data.at(0)
  if (!foundSubscription) return null
  return foundSubscription
}

async function createStripeSubcriptionIfDontExists(customer: StripeCustomer) {
  const [error, currentSubscription] = await getStripeSubscriptions(stripe, customer.id)
  if (error) return bad(error)
  const foundSubscription = currentSubscription.data.at(0)
  if (!!foundSubscription)
    return only({
      code: "EXISTS",
      subscription: foundSubscription,
    })
  const subscription = await makeStripeSubcription(customer)
  return only({ code: "CREATED", subscription })
}

export function makeStringId() {
  return `${Math.random().toString(36).substring(2, 9).toUpperCase()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

type CreateSubscriptionCheckoutSessionProps = {
  customerId: string
  userId: string
  email: string
  planName: PlanAllNames
}

export async function createSubscriptionCheckoutSession({
  customerId,
  userId,
  planName,
  email,
}: CreateSubscriptionCheckoutSessionProps): Promise<{ url: string }> {
  const { priceId } = appStripePlansPlanNameKey[planName]

  const { id_subscription: subscriptionIdNotification } =
    await prisma.subscriptionApprovedNotification.create({
      data: {
        createdAt: new Date(),
        updatedAt: new Date(),
        id_subscription: makeStringId(),
        user_id: userId,
        planName,
      },
    })

  const subscription = await getStripeCurrentSubscription(customerId)
  const currentSubscriptionId = extractId(subscription)

  let url
  if (!currentSubscriptionId) {
    ctxLog("NSTH: Tried to update a subscription, but didn't find any to this user, had to create one.")
    const session = await createCheckoutSubscriptionSession({
      customerId,
      subscriptionIdNotification,
      priceId,
      userId,
      email,
    })

    url = session.url
  } else {
    const currentSubscription = await stripe.subscriptionItems.list({
      subscription: subscription.id,
      limit: 1,
    })

    const session = await createBillingPortalSession({
      customerId,
      subscriptionIdNotification,
      priceId,
      subscriptionId: currentSubscriptionId,
      subscriptionItemId: currentSubscription.data[0].id,
    })
    url = session.url
  }

  if (!url) {
    throw new Error("No URL for this session.")
  }

  return { url }
}

function extractId(subscription: Stripe.Subscription | undefined | null) {
  return subscription?.id ?? null
}

type CreateBillingPortalSessionProps = {
  customerId: string
  priceId: string
  subscriptionId: string
  subscriptionIdNotification: string
  subscriptionItemId: string
}

async function createBillingPortalSession({
  customerId,
  subscriptionIdNotification,
  priceId,
  subscriptionId,
  subscriptionItemId,
}: CreateBillingPortalSessionProps) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: "".concat(env.CLIENT_URL).concat("/dashboard"),
    flow_data: {
      type: "subscription_update_confirm",
      after_completion: {
        type: "redirect",
        redirect: {
          return_url: ""
            .concat(env.CLIENT_URL)
            .concat(`/dashboard?plan_subscribed=${subscriptionIdNotification}`),
        },
      },
      subscription_update_confirm: {
        subscription: subscriptionId,
        items: [
          {
            id: subscriptionItemId,
            price: priceId,
            quantity: 1,
          },
        ],
      },
    },
  })
}

type CreateCheckoutSubscriptionSessionProps = {
  userId: string
  customerId: string
  subscriptionIdNotification: string
  priceId: string
  email: string
}

async function createCheckoutSubscriptionSession({
  userId,
  customerId,
  subscriptionIdNotification,
  priceId,
  email,
}: CreateCheckoutSubscriptionSessionProps) {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    metadata: { user_email: email },
    customer: customerId,
    client_reference_id: JSON.stringify({ userId, subscriptionIdNotification }),
    success_url: "".concat(env.CLIENT_URL).concat(`/dashboard?plan_subscribed=${subscriptionIdNotification}`),
    cancel_url: "".concat(env.CLIENT_URL).concat("/plans?fail=true"),
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  })
}
