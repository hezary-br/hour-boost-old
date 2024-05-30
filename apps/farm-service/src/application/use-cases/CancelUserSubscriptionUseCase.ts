import { DataOrFail, Fail, UsersRepository } from "core"
import Stripe from "stripe"
import { RollbackToGuestPlanUseCase } from "~/application/use-cases/RollbackToGuestPlanUseCase"
import { getUserByEmail } from "~/application/use-cases/helpers/getUser"
import {
  cancelStripeSubscription,
  getLastSubscription,
  getStripeCustomerByEmailOrFail,
} from "~/presentation/routes/stripe/methods"
import { bad, nice } from "~/utils/helpers"

interface ICancelUserSubscriptionUseCase {
  execute(
    props: CancelUserSubscriptionUseCaseDTO
  ): Promise<DataOrFail<Fail, { code: "NO-ACTIVE-SUBSCRIPTIONS" | "SUBSCRIPTION-CANCELLED"; data: any }>>
}

export class CancelUserSubscriptionUseCase implements ICancelUserSubscriptionUseCase {
  constructor(
    private readonly stripe: Stripe,
    private readonly rollbackToGuestPlanUseCase: RollbackToGuestPlanUseCase,
    private readonly usersRepository: UsersRepository
  ) {}

  async execute({ email }: CancelUserSubscriptionUseCaseDTO) {
    const [error$1, customer] = await getStripeCustomerByEmailOrFail(this.stripe, email)
    if (error$1) return bad(error$1)
    const [error$2, subscription] = await getLastSubscription(this.stripe, customer.id)
    if (error$2) return bad(error$2)
    const [errorGettingUser, user] = await getUserByEmail(this.usersRepository, email)
    if (errorGettingUser) return bad(errorGettingUser)
    if (!subscription) {
      const [error] = await this.rollbackToGuestPlanUseCase.execute({ user })
      if (error) return bad(error)
      return nice({ code: "NO-ACTIVE-SUBSCRIPTIONS", data: undefined })
    }
    const [error$3, result] = await cancelStripeSubscription(this.stripe, subscription.id)
    if (error$3) return bad(error$3)
    const [error$4] = await this.rollbackToGuestPlanUseCase.execute({ user })
    if (error$4) return bad(error$4)
    return nice({ code: "SUBSCRIPTION-CANCELLED", data: result })
  }
}

export type CancelUserSubscriptionUseCaseDTO = {
  email: string
}
