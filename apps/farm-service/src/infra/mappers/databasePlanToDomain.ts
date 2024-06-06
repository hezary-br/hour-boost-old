import {
  DiamondPlan,
  GoldPlan,
  GuestPlan,
  PlanInfinity,
  PlanInfinityRestoreFromCustomProps,
  PlanInfinityRestoreProps,
  PlanUsage,
  PlanUsageRestoreFromCustomProps,
  PlanUsageRestoreProps,
  SilverPlan,
  makeError,
} from "core"
import { databaseUsageListToDomain } from "~/infra/mappers/databaseUsageToDomain"
import { PrismaPlanWithUsages } from "~/infra/repository"

export function ensurePlan(plan: PrismaPlanWithUsages | null | undefined): PrismaPlanWithUsages {
  if (!plan) throw makeError("Usuário sem plano.", { plan })
  return plan
}
export function mapDatabasePlanToDomainWithUsages(plan: PrismaPlanWithUsages): PlanUsage | PlanInfinity {
  if (!plan.onceBelongedTo) throw makeError("Plano sem dono", { plan })
  if (plan.customPlan) {
    const restoreFromCustomInfinityProps: PlanInfinityRestoreFromCustomProps = {
      autoRestarter: plan.customPlan.autoRelogin,
      id_plan: plan.id_plan,
      maxGamesAllowed: plan.customPlan.maxGamesAllowed,
      maxSteamAccounts: plan.customPlan.maxSteamAccounts,
      price: plan.customPlan.priceInCents,
      ownerId: plan.onceBelongedTo,
      usages: databaseUsageListToDomain(plan.usages),
    }
    const restoreFromCustomUsageProps: PlanUsageRestoreFromCustomProps = {
      autoRestarter: plan.customPlan.autoRelogin,
      id_plan: plan.id_plan,
      maxGamesAllowed: plan.customPlan.maxGamesAllowed,
      maxSteamAccounts: plan.customPlan.maxSteamAccounts,
      maxUsageTime: plan.customPlan.maxUsageTime,
      price: plan.customPlan.priceInCents,
      ownerId: plan.onceBelongedTo,
      usages: databaseUsageListToDomain(plan.usages),
    }
    switch (plan.name) {
      case "DIAMOND":
        return DiamondPlan.restoreFromCustom(restoreFromCustomInfinityProps)
      case "GOLD":
        return GoldPlan.restoreFromCustom(restoreFromCustomInfinityProps)
      case "SILVER":
        return SilverPlan.restoreFromCustom(restoreFromCustomInfinityProps)
      case "GUEST":
        return GuestPlan.restoreFromCustom(restoreFromCustomUsageProps)
      default:
        plan.name satisfies never
    }
  }

  const restoreInfinityProps: PlanInfinityRestoreProps = {
    id_plan: plan.id_plan,
    ownerId: plan.onceBelongedTo,
    usages: databaseUsageListToDomain(plan.usages),
  }

  const restoreUsageProps: PlanUsageRestoreProps = {
    id_plan: plan.id_plan,
    ownerId: plan.onceBelongedTo,
    usages: databaseUsageListToDomain(plan.usages),
  }
  switch (plan.name) {
    case "DIAMOND":
      return DiamondPlan.restore(restoreInfinityProps)
    case "GOLD":
      return GoldPlan.restore(restoreInfinityProps)
    case "SILVER":
      return SilverPlan.restore(restoreInfinityProps)
    case "GUEST":
      return GuestPlan.restore(restoreUsageProps)
    default:
      plan.name satisfies never

      throw makeError("Caso impossível!", { plan })
  }
}
