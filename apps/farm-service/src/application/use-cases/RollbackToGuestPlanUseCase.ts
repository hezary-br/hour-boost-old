import { DataOrFail, Fail, User, UsersRepository, nice } from "core"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { PlanDAO } from "~/infra/dao/PlanDAO"
import { bad } from "~/utils/helpers"

interface IRollbackToGuestPlanUseCase {
  execute(props: RollbackToGuestPlanUseCaseDTO): Promise<DataOrFail<Fail, "SUCCESS">>
}

export class RollbackToGuestPlanUseCase implements IRollbackToGuestPlanUseCase {
  constructor(
    private readonly planDAO: PlanDAO,
    private readonly changeUserPlanUseCase: ChangeUserPlanUseCase,
    private readonly usersRepository: UsersRepository
  ) {}

  async execute({ user }: RollbackToGuestPlanUseCaseDTO) {
    const plan = await this.planDAO.getFirstGuestPlan(user.id_user)
    const [error] = await this.changeUserPlanUseCase.execute_toPlanId({ planId: plan.id_plan, user })
    if (error) return bad(error)

    return nice("SUCCESS")
  }

  async execute_byUserId({ userId }: RollbackToGuestPlanByUserIdUseCaseDTO) {
    const [error, user] = await getUser(this.usersRepository, userId)
    if (error) return bad(error)
    return this.execute({ user })
  }
}

export type RollbackToGuestPlanUseCaseDTO = {
  user: User
}

export type RollbackToGuestPlanByUserIdUseCaseDTO = {
  userId: string
}
