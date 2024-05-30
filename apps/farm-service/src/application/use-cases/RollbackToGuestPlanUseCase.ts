import { DataOrFail, Fail, User, nice } from "core"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { PlanDAO } from "~/infra/dao/PlanDAO"

interface IRollbackToGuestPlanUseCase {
  execute(props: RollbackToGuestPlanUseCaseDTO): Promise<DataOrFail<Fail, "SUCCESS">>
}

export class RollbackToGuestPlanUseCase implements IRollbackToGuestPlanUseCase {
  constructor(
    private readonly planDAO: PlanDAO,
    private readonly changeUserPlanUseCase: ChangeUserPlanUseCase
  ) {}

  async execute({ user }: RollbackToGuestPlanUseCaseDTO) {
    const plan = await this.planDAO.getFirstGuestPlan(user.id_user)
    this.changeUserPlanUseCase.execute_toPlanId({ planId: plan.id_plan, user })
    // TODO

    return nice("SUCCESS")
  }
}

export type RollbackToGuestPlanUseCaseDTO = {
  user: User
}
