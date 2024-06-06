import { PlanAllNames } from "core"

export interface PreApprovalPlanPayloadAll extends PreApprovalPlanPayload {}

export interface PreApprovalPlanPayload {
  userId: string
  email: string
  planName: PlanAllNames
}
