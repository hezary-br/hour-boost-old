import { PlanInfinityName } from "core"

export type CheckoutDTO = {
  preapprovalId: string
  toPlanName: PlanInfinityName
  userId: string
  userEmail: string
}

export interface CheckoutRepository {
  save(props: CheckoutDTO): Promise<void>
  getByUserId(userId: string): Promise<CheckoutDTO | null>
  getByPreapprovalId(preapprovalId: string): Promise<CheckoutDTO | null>
}
