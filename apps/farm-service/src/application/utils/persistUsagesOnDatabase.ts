import { Fail, type PlanInfinity, type PlanRepository, type PlanUsage, type Usage } from "core"
import type { PauseFarmOnAccountUsage } from "~/application/services"
import { bad, nice } from "~/utils/helpers"
import { EAppResults } from "../use-cases"

export async function persistUsagesOnDatabase(
  pauseFarm: PauseFarmOnAccountUsage,
  planRepository: PlanRepository
) {
  const plan = await planRepository.getById(pauseFarm.planId)
  if (!plan)
    return bad(
      Fail.create(EAppResults["PLAN-NOT-FOUND"], 404, {
        foundPlan: plan,
        givenPlanId: pauseFarm.planId,
      })
    )
  if (pauseFarm.type == "STOP-ALL") appendUsagesStopAll(plan, pauseFarm.usages)
  else if (pauseFarm.type == "STOP-ONE") appendUsagesStopOne(plan, pauseFarm.usage)
  else if (pauseFarm.type == "STOP-SILENTLY") {
  }
  await planRepository.update(plan)
  return nice()
}

export async function appendStopFarmUsageToPlan(
  pauseFarm: PauseFarmOnAccountUsage,
  plan: PlanUsage | PlanInfinity
) {
  if (pauseFarm.type == "STOP-ALL") appendUsagesStopAll(plan, pauseFarm.usages)
  else if (pauseFarm.type == "STOP-ONE") appendUsagesStopOne(plan, pauseFarm.usage)
  else if (pauseFarm.type == "STOP-SILENTLY") {
  }
}

function extractPlanId(pauseFarmOnAccountUsage: PauseFarmOnAccountUsage) {
  let planId = ""
  switch (pauseFarmOnAccountUsage.type) {
    case "STOP-ALL":
      planId = pauseFarmOnAccountUsage.usages[0].plan_id
      break
    case "STOP-ONE":
      planId = pauseFarmOnAccountUsage.usage.plan_id
      break
    case "STOP-SILENTLY":
      // planId = pauseFarmOnAccountUsage
      break
  }

  return planId
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
