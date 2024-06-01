import { PlanInfinity, PlanUsage } from "core"

export interface PlanDAO {
  getFirstGuestPlan(userId: string): Promise<PlanUsage>
  getUserCurrent(userId: string): Promise<PlanUsage | PlanInfinity | null>
}
