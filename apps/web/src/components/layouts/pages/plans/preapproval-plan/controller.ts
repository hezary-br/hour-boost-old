import { PlanAllNames } from "core"

export interface PreApprovalPlanPayloadAll extends PreApprovalPlanPayload { }

export interface PreApprovalPlanPayload {
  userId: string
  planName: PlanAllNames
}

