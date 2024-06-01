import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { GetResult, PlanAllNames } from "core"
import { Router } from "express"
import { Stripe } from "stripe"
import { z } from "zod"
import { EAppResults } from "~/application/use-cases"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { env } from "~/env"
import { prisma } from "~/infra/libs"
import { stripe } from "~/infra/services/stripe"
import { rateLimit } from "~/inline-middlewares/rate-limit"
import { validateBody } from "~/inline-middlewares/validate-payload"
import { cancelUserSubscriptionController, purchaseNewPlanController } from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import { Subscription } from "~/presentation/routes/stripe/Subscription"
import {
  createStripeCustomer,
  createSubscriptionStripe,
  getLastSubcriptionItemOrFail,
  getStripeCustomerByEmail,
  getStripeSubscriptions,
} from "~/presentation/routes/stripe/methods"
import { appStripePlansPlanNameKey } from "~/presentation/routes/stripe/plans"
import { planAllNamesSchema } from "~/schemas/planAllNamesSchema"
import { bad, nice, only } from "~/utils/helpers"

export const router_checkout: Router = Router()

export type StripeSubscriptions = Stripe.Response<Stripe.ApiList<Stripe.Subscription>>

router_checkout.delete("/subscription/current", ClerkExpressRequireAuth(), async (req, res) => {
  const [limited] = await rateLimit(req)
  if (limited) return res.status(limited.status).json(limited.json)

  const foundUser = await prisma.user.findUnique({
    where: { id_user: req.auth.userId! },
    select: { email: true },
  })

  if (!foundUser) {
    return res.status(404).json({
      code: EAppResults["USER-NOT-FOUND"],
      message: `Usuário não encontrado com id [${req.auth.userId}]`,
    })
  }

  const presentation = await cancelUserSubscriptionController.handle({
    email: foundUser.email,
  })
  return RequestHandlerPresenter.handle(presentation, res)
})

router_checkout.delete(
  "/subscription/notification/:subscriptionNotificationId",
  ClerkExpressRequireAuth(),
  async (req, res) => {
    const { subscriptionNotificationId } = req.params

    await prisma.subscriptionApprovedNotification.delete({
      where: { id_subscription: subscriptionNotificationId },
    })

    return res.status(200).json({ code: "DELETED-SUCCESSFULLY" })
  }
)

router_checkout.get(
  "/subscription/notification/:subscriptionNotificationId",
  ClerkExpressRequireAuth(),
  async (req, res) => {
    const { subscriptionNotificationId } = req.params

    const subscriptionApprovedNotification = await prisma.subscriptionApprovedNotification.findUnique({
      where: { id_subscription: subscriptionNotificationId },
    })

    return res.status(200).json(subscriptionApprovedNotification)
  }
)

router_checkout.post("/plan/preapproval", ClerkExpressRequireAuth(), async (req, res) => {
  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      userId: z.string().min(1, "Informe o ID do usuário."),
      email: z.string().email("Informe um e-mail válido."),
      planName: planAllNamesSchema,
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
  const [errorCreating, customer] = await getOrCreateCustomer({ email, name })
  if (errorCreating) return bad(errorCreating)

  const [error, checkoutSession] = await createSubscriptionCheckoutSession({
    customerId: customer.id,
    planName,
    userId,
    email,
  })
  if (error) return bad(error)
  const { url } = checkoutSession

  return nice({ url })
}

type CreateCustomerProps = {
  email: string
  name: string
}

export async function getOrCreateCustomer({ email, name }: CreateCustomerProps) {
  const customersWithThisEmail = await getStripeCustomerByEmail(stripe, email)
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
}: CreateSubscriptionCheckoutSessionProps) {
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
    const [error, currentSubscriptionItem] = await getLastSubcriptionItemOrFail(stripe, currentSubscriptionId)
    if (error) return bad(error)

    const session = await createBillingPortalSession({
      customerId,
      subscriptionIdNotification,
      priceId,
      subscriptionId: currentSubscriptionId,
      subscriptionItemId: currentSubscriptionItem.id,
    })
    url = session.url
  }

  if (!url) {
    throw new Error("No URL for this session.")
  }

  return nice({ url })
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
