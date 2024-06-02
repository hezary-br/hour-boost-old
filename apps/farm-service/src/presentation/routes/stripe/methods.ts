import { saferAsync } from "@hourboost/utils"
import { Fail, PlanAllNames } from "core"
import Stripe from "stripe"
import { StripeKnownEvents } from "~/application/services/WebhookEventStripe"
import { appStripePlansPlanNameKey, stripePriceIdListSchema } from "~/presentation/routes/stripe/plans"
import { createResponse } from "~/types/response-api"
import { bad, nice } from "~/utils/helpers"

type GetOrCreateSubscriptionStripeProps = {
  customerId: string
}

export async function getOrCreateSubscriptionStripe(
  stripe: Stripe,
  { customerId }: GetOrCreateSubscriptionStripeProps
) {
  let [error$1, subscription] = await getLastSubscription(stripe, customerId)
  if (error$1) return bad(error$1)
  if (!subscription) {
    const [error, createdSubscription] = await createSubscriptionStripe(stripe, {
      customerId: customerId,
      planName: "GUEST",
    })
    if (error) return bad(error)
    subscription = createdSubscription
  }
  const [error$2, item] = await getLastSubcriptionItem(stripe, subscription.id)
  if (error$2) return bad(error$2)
  if (!item) {
    return bad(
      Fail.create("NSTH-HAS-SUBSCRIPTION-WITH-NO-ITEMS", 400, { item, subscriptionId: subscription.id })
    )
  }
  return nice({ code: "ALREADY-HAS-SUBSCRIPTION", subscription })
}

type CreateSubscriptionProps = {
  customerId: string
  planName: PlanAllNames
}

export async function createSubscriptionStripe(
  stripe: Stripe,
  { customerId, planName }: CreateSubscriptionProps
) {
  const { priceId } = appStripePlansPlanNameKey[planName]
  const [error, result] = await saferAsync(() =>
    stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    })
  )
  if (error) return bad(Fail.create("FAILED-TO-CREATE-STRIPE-SUBCRIPTION", 400, { error }))
  return nice(result)
}

export async function getStripeCustomerByEmailOrFail(stripe: Stripe, email: string) {
  const customer = await getStripeCustomerByEmail(stripe, email)
  if (!customer) return bad(Fail.create("STRIPE-CUSTOMER-NOT-FOUND", 404, { customer, givenEmail: email }))
  return nice(customer)
}

export async function getStripeCustomerByEmail(stripe: Stripe, email: string) {
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

export async function getStripeSubscriptions(stripe: Stripe, customerId: string) {
  const [error, subscriptions] = await saferAsync(() =>
    stripe.subscriptions.list({
      customer: customerId,
    })
  )
  if (error) return bad(Fail.create("FAILED-TO-LIST-STRIPE-SUBSCRIPTIONS", 400, { error }))
  return nice(subscriptions)
}

type CreateStripeCustomerProps = {
  email: string
  name: string
}

export async function createStripeCustomer(stripe: Stripe, { email, name }: CreateStripeCustomerProps) {
  const [error, result] = await saferAsync(() =>
    stripe.customers.create({
      email,
      name,
      metadata: { email },
    })
  )
  if (error) {
    return bad(Fail.create("ERROR-CREATING-USER", 400, { error }))
  }
  return nice(result)
}

export async function getLastSubcriptionItemOrFail(stripe: Stripe, subscriptionId: string) {
  const [error, item] = await getLastSubcriptionItem(stripe, subscriptionId)
  if (error) return bad(error)

  if (!item) return bad(Fail.create("NSTH-HAS-SUBSCRIPTION-WITH-NO-ITEMS", 400, { item, subscriptionId }))
  return nice(item)
}

export async function getLastSubcriptionItem(stripe: Stripe, subscriptionId: string) {
  const [error, result] = await saferAsync(() =>
    stripe.subscriptionItems.list({
      subscription: subscriptionId,
      limit: 1,
    })
  )

  if (error) {
    return bad(Fail.create("ERROR-GETTING-LAST-SUBSCRIPTION-ITEM", 400, { error }))
  }
  return nice(result.data[0] ?? null)
}

export async function getLastSubscription(stripe: Stripe, customerId: string) {
  const [error, result] = await saferAsync(() =>
    stripe.subscriptions.list({
      customer: customerId,
    })
  )

  if (error) {
    return bad(Fail.create("ERROR-GETTING-LAST-SUBSCRIPTION", 400, { error }))
  }
  return nice(result.data[0] ?? null)
}

export async function cancelStripeSubscription(stripe: Stripe, subscriptionId: string) {
  const [error, result] = await saferAsync(() => stripe.subscriptions.cancel(subscriptionId))
  if (error) return bad(Fail.create("FAILED-TO-CANCEL-STRIPE-SUBSCRIPTION", 400, { subscriptionId }))
  return nice(result)
}

export async function getStripeCustomerById(stripe: Stripe, customerId: string) {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return customer
}

export function extractStripeEventData(event: StripeKnownEvents) {
  const stripePriceIdParse = stripePriceIdListSchema.safeParse(event.data.object.items.data[0]?.price.id) // TODO
  if (!stripePriceIdParse.success) {
    return bad(createResponse(400, { message: "PriceId desconhecido." }))
  }
  const stripeCustomerId = event.data.object.customer as string
  const id_subscription = event.data.object.id as string
  const stripeStatus = event.data.object.status
  const stripePriceId = stripePriceIdParse.data

  return nice({
    id_subscription,
    stripePriceId,
    stripeStatus,
    stripeCustomerId,
  })
}

export async function getUserEmail(stripe: Stripe, user_email: string | undefined, customerId: string) {
  if (!user_email) {
    const customer = await getStripeCustomerById(stripe, customerId)
    if (!customer?.email) {
      console.log("NSTH: There is no user email, neither on the customer Id, and the metadata.")
      return bad(Fail.create("NSTH-CUSTOMER-WITHOUT-EMAIL", 500))
    }
    user_email = customer.email
  }
  return nice(user_email)
}
