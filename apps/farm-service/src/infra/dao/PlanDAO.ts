import { PlanUsage } from "core"

export interface PlanDAO {
  getFirstGuestPlan(userId: string): Promise<PlanUsage>
}
