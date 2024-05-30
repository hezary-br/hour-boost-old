import { DataOrFail, Fail } from "core"
import Stripe from "stripe"
import {
  cancelStripeSubscription,
  getLastSubscription,
  getStripeCustomerByEmailOrFail,
} from "~/presentation/routes/stripe/methods"
import { bad, nice } from "~/utils/helpers"

interface ICancelUserSubscriptionUseCase {
  execute(props: CancelUserSubscriptionUseCaseDTO): Promise<DataOrFail<Fail, any>>
}

export class CancelUserSubscriptionUseCase implements ICancelUserSubscriptionUseCase {
  constructor(private readonly stripe: Stripe) {}

  async execute({ email }: CancelUserSubscriptionUseCaseDTO) {
    const [error$1, customer] = await getStripeCustomerByEmailOrFail(this.stripe, email)
    if (error$1) return bad(error$1)
    const [error$2, subscription] = await getLastSubscription(this.stripe, customer.id)
    if (error$2) return bad(error$2)
    if (!subscription) {
      return bad(
        Fail.create("SUBSCRIPTION-NOT-FOUND", 404, {
          hintMessage: "Customer's subscription list is empty.",
          customerId: customer.id,
        })
      )
    }
    const [error$3, result] = await cancelStripeSubscription(this.stripe, subscription.id)
    if (error$3) return bad(error$3)
    return nice(result)
  }
}

export type CancelUserSubscriptionUseCaseDTO = {
  email: string
}
