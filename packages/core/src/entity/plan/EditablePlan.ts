import { IEditablePlan } from "core/entity/plan/IEditablePlan"
import { Plan } from "core/entity/plan/Plan"
import { makeError } from "core/utils/throw"

export class EditablePlan implements IEditablePlan {
  constructor(private readonly plan: Plan) {}

  setMaxAccountsAmount(amount: number): void {
    if (amount < 0) {
      throw makeError("Invariant! Tentou setar máximos de contas do plano com um valor fora do esperado.", {
        amount,
      })
    }
    if (!this.plan.custom) this.plan.custom = true
    this.plan.maxSteamAccounts = amount
  }

  setMaxGamesAmount(amount: number) {
    if (amount < 0 || amount > 32) {
      throw makeError("Invariant! Tentou setar máximos de jogos do plano com um valor fora do esperado.", {
        amount,
      })
    }
    if (!this.plan.custom) this.plan.custom = true
    this.plan.maxGamesAllowed = amount
  }
}
