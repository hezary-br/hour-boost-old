import {
  Preapproval,
  PreapprovalRepository,
  PreapprovalRepositoryListFilter,
} from "~/infra/repository/PreapprovalRepository"
import { preApprovalPlan } from "~/infra/services/checkout/Mercadopago"

export class PreapprovalRepositoryMemory implements PreapprovalRepository {
  list(filter?: PreapprovalRepositoryListFilter | undefined): Promise<Preapproval[]> {
    throw new Error("Method not implemented.")
  }
  checkIfExists(preapprovalId: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  save(preapproval: Preapproval): Promise<void> {
    throw new Error("Method not implemented.")
  }
  getByPrepprovalId(preapprovalId: string): Promise<Preapproval | null> {
    throw new Error("Method not implemented.")
  }
  async getCurrent(userId: string): Promise<Preapproval | null> {
    throw new Error("Method not implemented.")
  }
  data_usersPreapprovals: Map<string, Set<Preapproval>> = new Map()
  data_preapprovalId: Map<string, Preapproval> = new Map()

  async getById(preapprovalId: string): Promise<Preapproval | null> {
    return this.data_preapprovalId.get(preapprovalId) ?? null
  }

  async getCurrentByUserId(userId: string): Promise<Preapproval | null> {
    const preapprovals = this.data_usersPreapprovals.get(userId)
    if (!preapprovals) return null
    return [...preapprovals].at(-1) ?? null
  }

  async saveNew(preapproval: Preapproval): Promise<void> {
    this.data_preapprovalId.set(preapproval.preapprovalId, preapproval)
    let preApprovals = this.data_usersPreapprovals.get(preapproval.userId)
    if (!preApprovals) {
      preApprovals = new Set()
      this.data_usersPreapprovals.set(preapproval.userId, preApprovals)
      return
    }
    preApprovals.add(preapproval)
  }
}
