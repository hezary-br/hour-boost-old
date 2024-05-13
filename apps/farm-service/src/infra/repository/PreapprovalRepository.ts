import { PlanInfinityName } from "core"
import { z } from "zod"

export type PreapprovalRepositoryListFilter = {
  limit?: number
}

export interface PreapprovalRepository {
  getCurrent(userId: string): Promise<Preapproval | null>
  saveNew(preapproval: Preapproval): Promise<void>
  getByPrepprovalId(preapprovalId: string): Promise<Preapproval | null>
  checkIfExists(preapprovalId: string): Promise<boolean>
  save(preapproval: Preapproval): Promise<void>
  list(filter?: PreapprovalRepositoryListFilter): Promise<Preapproval[]>
}

export class Preapproval {
  userId: string
  planName: PlanInfinityName
  status: "authorized" | "cancelled"
  previousPreapprovalId: string | null
  preapprovalId: string
  payerId: number | undefined
  createdAt: Date

  constructor(props: PreapprovalProps) {
    this.userId = props.userId
    this.planName = props.planName
    this.previousPreapprovalId = props.previousPreapprovalId
    this.preapprovalId = props.preapprovalId
    this.status = props.status
    this.payerId = props.payerId
    this.createdAt = props.createdAt
  }
}

export type PreapprovalProps = {
  userId: string
  planName: PlanInfinityName
  previousPreapprovalId: string | null
  preapprovalId: string
  status: "authorized" | "cancelled"
  payerId: number | undefined
  createdAt: Date
}

export const preapprovalPlanNameSchema = z.enum(["SILVER", "GOLD", "DIAMOND"])
export const preapprovalStatusSchema = z.enum(["authorized", "cancelled"])
