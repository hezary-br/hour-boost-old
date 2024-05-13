import { DataOrFail, Fail, PlanAllNames, UsersRepository } from "core"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { createCheckout } from "~/infra/services/checkout/create"
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

    const { checkoutUrl } = await createCheckout({
      email: user.email,
      plan: planName,
      userId,
    })

    return nice({ checkoutUrl })
  }
}

export type PurchaseNewPlanUseCaseDTO = {
  planName: PlanAllNames
  userId: string
  email: string
}
