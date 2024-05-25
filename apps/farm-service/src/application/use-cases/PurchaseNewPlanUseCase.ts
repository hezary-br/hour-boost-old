import { saferAsync } from "@hourboost/utils"
import { DataOrFail, Fail, PlanAllNames, UsersRepository } from "core"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { createSubscriptionCheckoutSessionByEmail } from "~/presentation/routes/stripe"
import { bad, nice } from "~/utils/helpers"

interface IPurchaseNewPlanUseCase {
  execute(props: PurchaseNewPlanUseCaseDTO): Promise<DataOrFail<Fail, { checkoutUrl: string }>>
}

export class PurchaseNewPlanUseCase implements IPurchaseNewPlanUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ userId, planName }: PurchaseNewPlanUseCaseDTO) {
    const [error, user] = await getUser(this.usersRepository, userId)
    if (error) return bad(error)

    if (planName === "GUEST") {
      return bad(Fail.create("ATTEMPT-TO-ASSIGN-GUEST-PLAN", 403, { userId, planName }))
    }

    if (user.plan.name === planName) {
      return bad(Fail.create("ATTEMPT-TO-ASSIGN-SAME-PLAN", 403, { userId, planName, userPlan: user.plan }))
    }

    const [errorCreatingCheckout, checkout] = await saferAsync(() =>
      createSubscriptionCheckoutSessionByEmail({
        email: user.email,
        planName,
        userId,
      })
    )

    if (errorCreatingCheckout) {
      return bad(Fail.create("ERROR-CREATING-CHECKOUT", 400, { errorCreatingCheckout }))
    }

    return nice({ checkoutUrl: checkout.url })
  }
}

export type PurchaseNewPlanUseCaseDTO = {
  planName: PlanAllNames
  userId: string
  email: string
}
