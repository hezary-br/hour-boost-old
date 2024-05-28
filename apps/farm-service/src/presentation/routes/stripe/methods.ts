import { saferAsync } from "@hourboost/utils"
import { Fail, PlanAllNames, User } from "core"
import Stripe from "stripe"
import { appStripePlansPlanNameKey } from "~/presentation/routes/stripe/plans"
import { bad, nice } from "~/utils/helpers"

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

type GetStripeCustomerByEmailProps = {
  email: string
}

export async function getStripeCustomerByEmail(stripe: Stripe, { email }: GetStripeCustomerByEmailProps) {
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
