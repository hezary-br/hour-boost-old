import { PlanAllNames } from "core"

export function getPlanNameCheckIfCustom(planName: PlanAllNames, custom: boolean): string {
  return `${getPlanName(planName)}${custom ? "*" : ""}`
}

export function getPlanName(planName: PlanAllNames): string {
  const planNamesMapper: Record<PlanAllNames, string> = {
    DIAMOND: "Diamante",
    GOLD: "Ouro",
    GUEST: "Convidado",
    SILVER: "Prata",
  }

  return planNamesMapper[planName]
}
