import { Fail } from "core"
import { EAppResults } from "~/application/use-cases"
import { PlanDAO } from "~/infra/dao/PlanDAO"
import { bad, nice } from "~/utils/helpers"

export class UserApplicationService {
  constructor(private readonly planDAO: PlanDAO) {}

  async getCurrentPlanOrNull(userId: string) {
    return await this.planDAO.getUserCurrent(userId)
  }

  async getCurrentPlan(userId: string) {
    const plan = await this.getCurrentPlanOrNull(userId)
    if (!plan) return bad(Fail.create(EAppResults["PLAN-NOT-FOUND"], 404))
    return nice(plan)
  }
}
