import { CheckoutDTO, CheckoutRepository } from "~/infra/repository/CheckoutRepository"

export class CheckoutRepositoryMemory implements CheckoutRepository {
  readonly list: CheckoutDTO[] = []

  async save(checkout: CheckoutDTO): Promise<void> {
    this.list.push(checkout)
  }
  async getByUserId(userId: string): Promise<CheckoutDTO | null> {
    return this.list.find(checkout => checkout.userId === userId) ?? null
  }
  async getByPreapprovalId(preapprovalId: string): Promise<CheckoutDTO | null> {
    return this.list.find(checkout => checkout.preapprovalId === preapprovalId) ?? null
  }
}
