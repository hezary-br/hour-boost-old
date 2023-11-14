import { PlanInfinity, PlanType, PlanUsage } from "core"

export * from "./FarmUsageService"
export * from "./FarmingUsageController"
export * from "./FarmInfinityService"
export * from "./FarmUsageService"
export * from "./FarmingUsersStorage"

export type FarmServiceStatus = "FARMING" | "IDDLE"

export interface IFarmService {
  type: PlanType
  status: FarmServiceStatus
  username: string
  ownerId: string
  startFarm(): void
  stopFarm(): void
}

export type FarmStatusCount = {
  FARMING: number
  IDDLE: number
}
