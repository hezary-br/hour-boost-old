import { Fail, type PlanInfinity, type PlanRepository, type PlanUsage, type Usage } from "core"
import type { FarmSession } from "~/application/services"
import { bad, nice } from "~/utils/helpers"
import { EAppResults } from "../use-cases"

export async function persistUsagesOnDatabase(farmSession: FarmSession, planRepository: PlanRepository) {
  const plan = await planRepository.getById(farmSession.planId)
  if (!plan)
    return bad(
      Fail.create(EAppResults["PLAN-NOT-FOUND"], 404, {
        foundPlan: plan,
        givenPlanId: farmSession.planId,
      })
    )
  if (farmSession.type == "STOP-ALL") appendUsagesStopAll(plan, farmSession.usages)
  else if (farmSession.type == "STOP-ONE") appendUsagesStopOne(plan, farmSession.usage)
  else if (farmSession.type == "STOP-SILENTLY") {
  }
  await planRepository.update(plan)
  return nice()
}

export async function appendStopFarmUsageToPlan(farmSession: FarmSession, plan: PlanUsage | PlanInfinity) {
  if (farmSession.type == "STOP-ALL") appendUsagesStopAll(plan, farmSession.usages)
  else if (farmSession.type == "STOP-ONE") appendUsagesStopOne(plan, farmSession.usage)
  else if (farmSession.type == "STOP-SILENTLY") {
  }
}

function appendUsagesStopAll<TPlan extends PlanUsage | PlanInfinity>(plan: TPlan, usages: Usage[]): TPlan {
  for (const usage of usages) {
    plan.use(usage)
  }
  return plan
}

function appendUsagesStopOne<TPlan extends PlanUsage | PlanInfinity>(plan: TPlan, usage: Usage): TPlan {
  plan.use(usage)
  return plan
}
