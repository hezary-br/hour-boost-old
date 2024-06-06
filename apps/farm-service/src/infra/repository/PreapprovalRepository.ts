import { PlanInfinityName } from "core"
import { z } from "zod"

export type PreapprovalRepositoryListFilter = {
  idList?: string[]
  limit?: number
}

export interface PreapprovalRepository {
  getCurrent(userId: string): Promise<Preapproval | null>
  saveNew(preapproval: Preapproval): Promise<void>
  save(preapproval: Preapproval): Promise<void>
  getByPrepprovalId(preapprovalId: string): Promise<Preapproval | null>
  checkIfExists(preapprovalId: string): Promise<boolean>
  list(filter?: PreapprovalRepositoryListFilter): Promise<Preapproval[]>
}

export class Preapproval {
  userId: string
  planName: PlanInfinityName
  status: PreapprovalStatus
  previousPreapprovalId: string | null
  preapprovalId: string
  payerId: number | undefined
  createdAt: Date
  isCurrent: boolean

  constructor(props: PreapprovalProps) {
    this.userId = props.userId
    this.planName = props.planName
    this.previousPreapprovalId = props.previousPreapprovalId
    this.preapprovalId = props.preapprovalId
    this.status = props.status
    this.payerId = props.payerId
    this.createdAt = props.createdAt
    this.isCurrent = props.isCurrent
  }

  cancel() {
    this.status = "cancelled"
  }
}

export type PreapprovalProps = {
  userId: string
  planName: PlanInfinityName
  previousPreapprovalId: string | null
  preapprovalId: string
  status: PreapprovalStatus
  payerId: number | undefined
  createdAt: Date
  isCurrent: boolean
}

export const preapprovalPlanNameSchema = z.enum(["SILVER", "GOLD", "DIAMOND"])
export const preapprovalStatusSchema = z.enum(["authorized", "cancelled", "pending"])
export type PreapprovalStatus = z.infer<typeof preapprovalStatusSchema>
