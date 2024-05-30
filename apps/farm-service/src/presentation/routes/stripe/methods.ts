import { saferAsync } from "@hourboost/utils"
import { Fail, PlanAllNames, User } from "core"
import Stripe from "stripe"
import { appStripePlansPlanNameKey } from "~/presentation/routes/stripe/plans"
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
