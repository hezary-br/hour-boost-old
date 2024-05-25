import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { PlanAllNames } from "core"
import { Router } from "express"
import { Stripe } from "stripe"
import { z } from "zod"
import { env } from "~/env"
import { prisma } from "~/infra/libs"
import { validateBody } from "~/inline-middlewares/validate-payload"
import { purchaseNewPlanController } from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import { Subscription } from "~/presentation/routes/stripe/Subscription"
import { appStripePlans } from "~/presentation/routes/stripe/plans"
import { only } from "~/utils/helpers"

console.log({ STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY })
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
})

export const router_checkout: Router = Router()

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

type CreateStripeCustomerProps = {
  email: string
  name: string
}

export async function createStripeCustomer({ email, name }: CreateStripeCustomerProps) {
  return stripe.customers.create({
    email,
    name,
    metadata: { email },
  })
}

type GetStripeCustomerByEmailProps = {
  email: string
}

export async function getStripeCustomerByEmail({ email }: GetStripeCustomerByEmailProps) {
  const customersWithThisEmail = await stripe.customers.list({
    email,
  })

  if (customersWithThisEmail.data.length > 1) {
    throw new Error("Two customers with the same email.")
  }

  const foundCustomer = customersWithThisEmail.data.at(0)

  if (!foundCustomer) {
    return null
  }

  if (!foundCustomer.email) {
    throw new Error("Customer with no email.")
  }

  return { ...foundCustomer, email: foundCustomer.email }
}

type CreateCustomerProps = {
  email: string
  name: string
}

export async function getOrCreateCustomer({ email, name }: CreateCustomerProps) {
  const customersWithThisEmail = await getStripeCustomerByEmail({ email })
  if (customersWithThisEmail) return customersWithThisEmail

  const customerCreated = await createStripeCustomer({ email, name })
  if (!customerCreated.email) throw new Error("Customer with no email.")
  return { ...customerCreated, email: customerCreated.email }
}

export type StripeCustomer = Awaited<ReturnType<typeof getOrCreateCustomer>>

type CreateSubscriptionProps = {
  customerId: string
  planName: PlanAllNames
}

export async function createSubscriptionStripe({ customerId, planName }: CreateSubscriptionProps) {
  const { priceId } = appStripePlans[planName]
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  })
}

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
  const subscriptionStripe = await createSubscriptionStripe({
    customerId: customer.id,
    planName: "GUEST",
  })

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

export async function getStripeSubscriptions(customerId: string) {
  return await stripe.subscriptions.list({
    customer: customerId,
  })
}

export async function createStripeSubcriptionIfDontExists(customer: StripeCustomer) {
  const currentSubscription = await getStripeSubscriptions(customer.id)
  const foundSubscription = currentSubscription.data.at(0)
  if (!!foundSubscription)
    return only({
      code: "EXISTS",
      subscription: foundSubscription,
    })
  const subscription = await makeStripeSubcription(customer)
  return only({ code: "CREATED", subscription })
}

type CreateSubscriptionCheckoutSessionByEmailProps = {
  email: string
  userId: string
  planName: PlanAllNames
}

export async function createSubscriptionCheckoutSessionByEmail({
  email,
  planName,
  userId,
}: CreateSubscriptionCheckoutSessionByEmailProps) {
  const customer = await getStripeCustomerByEmail({ email })
  if (!customer) throw new Error(`No customer found with email ${email}`)

  return createSubscriptionCheckoutSession({
    customerId: customer.id,
    planName,
    userId,
  })
}

export function makeStringId() {
  return `${Math.random().toString(36).substring(2, 9).toUpperCase()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

type CreateSubscriptionCheckoutSessionProps = {
  customerId: string
  userId: string
  planName: PlanAllNames
}

export async function createSubscriptionCheckoutSession({
  customerId,
  userId,
  planName,
}: CreateSubscriptionCheckoutSessionProps) {
  const { priceId } = appStripePlans[planName]

  const { id_subscription } = await prisma.subscriptionApprovedNotification.create({
    data: {
      createdAt: new Date(),
      updatedAt: new Date(),
      id_subscription: makeStringId(),
      user_id: userId,
      planName,
    },
  })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer: customerId,
    client_reference_id: JSON.stringify({ userId, id_subscription }),
    success_url: "".concat(env.CLIENT_URL).concat(`/dashboard?plan_subscribed=${id_subscription}`),
    cancel_url: "".concat(env.CLIENT_URL).concat("/plans?fail=true"),
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  })

  if (!session.url) {
    throw new Error("No URL for this session.")
  }

  return {
    url: session.url,
  }
}
