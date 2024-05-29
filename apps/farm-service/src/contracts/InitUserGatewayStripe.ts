import { saferAsync } from "@hourboost/utils"
import { Fail, User } from "core"
import Stripe from "stripe"
import { InitUserGateway } from "~/contracts/InitUserGateway"
import { getOrCreateCustomer } from "~/presentation/routes/stripe"
import { createSubscriptionStripe } from "~/presentation/routes/stripe/methods"
import { bad, nice } from "~/utils/helpers"

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
