import { DataOrFail, Fail, PlanInfinity, PlanRepository, PlanUsage, nice } from "core"
import { EAppResults } from "~/application/use-cases/RestoreAccountSessionUseCase"
import { PlanDAO } from "~/infra/dao/PlanDAO"
import { bad } from "~/utils/helpers"

interface IGetUserPlanUseCase {
  execute(props: GetUserPlanUseCaseDTO): Promise<DataOrFail<Fail, PlanUsage | PlanInfinity>>
}

export class GetUserPlanUseCase implements IGetUserPlanUseCase {
  constructor(private readonly planDAO: PlanDAO) {}

  async execute({ userId }: GetUserPlanUseCaseDTO) {
    const plan = await this.execute_orNull({ userId })
    if (!plan) return bad(Fail.create(EAppResults["PLAN-NOT-FOUND"], 404))
    return nice(plan)
  }

  async execute_orNull({ userId }: GetUserPlanUseCaseDTO) {
    return await this.planDAO.getUserCurrent(userId)
  }
}

export type GetUserPlanUseCaseDTO = {
  userId: string
}
