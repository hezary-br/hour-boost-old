import { saferAsync } from "@hourboost/utils"
import { Fail, User } from "core"
import { InitUserGateway } from "~/contracts/InitUserGateway"
import {
  createStripeCustomer,
  createSubscriptionStripe,
  getStripeCustomerByEmail,
  getStripeSubscriptions,
} from "~/presentation/routes/stripe/methods"
import { bad, nice } from "~/utils/helpers"

export class InitUserGatewayStripe implements InitUserGateway {
  async execute({ username, email }: User) {
    const createSubscription = (customerId: string) =>
      createSubscriptionStripe({ customerId, planName: "GUEST" })

    let customerId
    const foundCustomer = await getStripeCustomerByEmail({ email })
    if (foundCustomer) {
      customerId = foundCustomer.id
      const [error$1, subscription] = await getStripeSubscriptions(foundCustomer.id)
      if (error$1) return bad(error$1)
      if (subscription.data.length > 0) {
        return nice("CUSTOMER-EXISTS-AND-HAS-SUBSCRIPTION")
      }
      const [error] = await createSubscription(foundCustomer.id)
      if (error) return bad(error)
      return nice("CUSTOMER-EXISTS-AND-HAD-TO-CREATE-SUBSCRIPTION")
    }
    const customer = await createStripeCustomer({ email, name: username })
    customerId = customer.id
    const [errorCreatingSubs] = await saferAsync(() => createSubscription(customer.id))
    if (errorCreatingSubs) {
      return bad(
        Fail.create("FAILED-TO-CREATE-STRIPE-CUSTOMER", 400, { customer, reason: errorCreatingSubs })
      )
    }
    return nice("CUSTOMER-CREATED-AND-SUBSCRIPTION-MADE")
  }
}
