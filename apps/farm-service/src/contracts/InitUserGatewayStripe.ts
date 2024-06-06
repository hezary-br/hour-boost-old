import { Fail, User } from "core"
import Stripe from "stripe"
import { InitUserGateway } from "~/contracts/InitUserGateway"
import { getOrCreateCustomer } from "~/presentation/routes/stripe"
import { getOrCreateSubscriptionStripe } from "~/presentation/routes/stripe/methods"
import { bad, nice } from "~/utils/helpers"

export class InitUserGatewayStripe implements InitUserGateway {
  constructor(private readonly stripe: Stripe) {}

  async execute({ username, email }: User) {
    const getOrCreateSubscription = (customerId: string) =>
      getOrCreateSubscriptionStripe(this.stripe, { customerId })

    const [error, customer] = await getOrCreateCustomer({ email, name: username })
    if (error) return bad(error)
    const [errorCreatingSubs] = await getOrCreateSubscription(customer.id)
    if (errorCreatingSubs) {
      return bad(
        Fail.create("FAILED-TO-CREATE-STRIPE-CUSTOMER", 400, { customer, reason: errorCreatingSubs })
      )
    }
    return nice("CUSTOMER-CREATED-AND-SUBSCRIPTION-MADE")
  }
}
