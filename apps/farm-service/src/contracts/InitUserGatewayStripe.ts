import { saferAsync } from "@hourboost/utils"
import { Fail, User } from "core"
import Stripe from "stripe"
import { InitUserGateway } from "~/contracts/InitUserGateway"
import { stripe } from "~/infra/services/stripe"
import { createSubscriptionStripe, getStripeCustomerByEmail } from "~/presentation/routes/stripe/methods"
import { bad, nice } from "~/utils/helpers"

type CreateCustomerProps = {
  email: string
  name: string
}

export async function getOrCreateCustomer({ email, name }: CreateCustomerProps) {
  const customersWithThisEmail = await getStripeCustomerByEmail(stripe, { email })
  if (customersWithThisEmail) return nice(customersWithThisEmail)

  const customerCreated = await stripe.customers.create({
    email,
    name,
    metadata: { email },
  })

  if (!customerCreated.email) throw new Error("Customer with no email.")
  return nice({ ...customerCreated, email: customerCreated.email })
}
export class InitUserGatewayStripe implements InitUserGateway {
  constructor(private readonly stripe: Stripe) {}

  async execute({ username, email }: User) {
    const createSubscription = (customerId: string) =>
      createSubscriptionStripe(this.stripe, { customerId, planName: "GUEST" })

    const [error, customer] = await getOrCreateCustomer({ email, name: username })
    if (error) return bad(error)
    const [errorCreatingSubs] = await saferAsync(() => createSubscription(customer.id))
    if (errorCreatingSubs) {
      return bad(
        Fail.create("FAILED-TO-CREATE-STRIPE-CUSTOMER", 400, { customer, reason: errorCreatingSubs })
      )
    }
    return nice("CUSTOMER-CREATED-AND-SUBSCRIPTION-MADE")
  }
}
