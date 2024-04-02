import { type DataOrError, Fail, type PlanInfinity, type PlanType, type Usage } from "core"
import { UserCompleteFarmSessionCommand } from "~/application/commands"
import {
  type AccountStatusList,
  FarmService,
  type NSFarmService,
  type PauseFarmOnAccountUsage,
} from "~/application/services/FarmService"
import { SteamAccountClient } from "~/application/services/steam"
import { EAppResults } from "~/application/use-cases"
import { getUsageAmountTimeFromDateRange } from "~/domain/utils/getUsageAmountTimeFromDateRange"
import type { Publisher } from "~/infra/queue"
import { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { bad, nice } from "~/utils/helpers"

export type FarmInfinityAccountStatus = {
  accountName: string
  startedAt: Date
}

export class FarmInfinityService extends FarmService {
  private readonly codify = <const T extends string = string>(moduleCode: T) =>
    `[FarmInfinityService]:${moduleCode}` as const

  readonly usageBuilder = new UsageBuilder()
  protected readonly farmingAccounts = new Map<string, FarmInfinityAccountStatus>()
  type: PlanType = "INFINITY"

  constructor(publisher: Publisher, plan: PlanInfinity, username: string, now: Date) {
    super({
      planId: plan.id_plan,
      startedAt: now,
      userId: plan.ownerId,
      username,
      publisher,
    })
  }

  getActiveFarmingAccountsAmount(): number {
    return this.farmingAccounts.size
  }

  hasAccountsFarming(): boolean {
    return this.getActiveFarmingAccountsAmount() > 0
  }

  protected publishCompleteFarmSession(
    pauseFarmCategory: PauseFarmOnAccountUsage,
    isFinalizingSession: boolean
  ): void {
    this.publisher.publish(
      new UserCompleteFarmSessionCommand({
        pauseFarmCategory,
        planId: this.planId,
        when: new Date(),
        isFinalizingSession,
        userId: this.userId,
      })
    )
  }

  protected getFarmingAccountsNameList(): string[] {
    return Array.from(this.farmingAccounts.keys())
  }

  protected stopFarmImpl() {
    const now = new Date()
    const usages: Usage[] = []
    for (const [accountName, farmingAccountDetails] of this.farmingAccounts) {
      const amountTime = getUsageAmountTimeFromDateRange(farmingAccountDetails.startedAt, now)
      const usage = this.usageBuilder.create({
        accountName,
        amountTime,
        createdAt: now,
        plan_id: this.planId,
        user_id: this.userId,
      })
      usages.push(usage)
    }
    this.farmingAccounts.clear()
    return { usages }
  }

  protected stopFarmSync(): Usage[] {
    const { usages } = this.stopFarmImpl()
    return usages
  }

  private pauseFarmOnAccountImpl(accountName: string) {
    const account = this.getAccount(accountName)
    if (!account) {
      return bad(
        Fail.create("PAUSE-FARM-ON-ACCOUNT-NOT-FOUND", 403, {
          accountName,
          accountsFarming: this.getFarmingAccountsNameList(),
        })
      )
    }
    const when = new Date()
    const amountTime = getUsageAmountTimeFromDateRange(this.startedAt, when)
    const usageBuilder = new UsageBuilder()
    const usage = usageBuilder.create({
      accountName,
      amountTime,
      createdAt: when,
      plan_id: this.planId,
      user_id: this.userId,
    })
    this.farmingAccounts.delete(accountName)
    return nice(usage)
  }

  pauseFarmOnAccount(accountName: string, isFinalizingSession: boolean) {
    const [errorPausingFarmOnAccount, usage] = this.pauseFarmOnAccountImpl(accountName)
    if (errorPausingFarmOnAccount) return bad(errorPausingFarmOnAccount)
    this.publishCompleteFarmSession(
      { planId: this.planId, type: "STOP-ONE", usage, accountName },
      isFinalizingSession
    )
    return nice(null)
  }

  pauseFarmOnAccountSync(accountName: string) {
    const [errorPausingFarmOnAccount, usage] = this.pauseFarmOnAccountImpl(accountName)
    if (errorPausingFarmOnAccount) return bad(errorPausingFarmOnAccount)
    return nice({ planId: this.planId, type: "STOP-ONE", usage, accountName })
  }

  // pauseFarmOnAccount(accountName: string): DataOrError<PauseFarmOnAccountUsage> {
  // }

  // protected stopFarm(): void {
  //   this.publishCompleteFarmSession()
  //   this.farmingAccounts.clear()
  // }

  getAccountsStatus(): AccountStatusList {
    const accountStatusList: AccountStatusList = {}

    for (const [accountName] of this.farmingAccounts) {
      accountStatusList[accountName] = "FARMING"
    }

    return accountStatusList
  }

  getFarmingAccounts(): DataOrError<NSFarmService.GetFarmingAccounts> {
    const accountStatus = {} as NSFarmService.GetFarmingAccounts
    for (const [accountName] of this.farmingAccounts) {
      accountStatus[accountName] = "FARMING"
    }

    return [null, accountStatus]
  }

  farmWithAccountImpl(accountName: string) {
    this.farmingAccounts.set(accountName, {
      accountName,
      startedAt: new Date(),
    })
    return nice(null)
  }

  private getAccount(accountName: string): FarmInfinityAccountStatus | null {
    const foundAccount = this.farmingAccounts.get(accountName)
    return foundAccount ?? null
  }

  protected stopFarm(isFinalizingSession: boolean): void {
    const { usages } = this.stopFarmImpl()
    this.publishCompleteFarmSession(
      {
        planId: this.planId,
        type: "STOP-ALL",
        usages,
        accountNameList: this.getFarmingAccountsNameList(),
      },
      isFinalizingSession
    )
  }

  checkIfCanFarm() {
    return nice()
  }

  protected startFarm() {
    return nice(null)
  }

  protected startFarmImpl(): void {
    console.log(`${this.username} starting farming`)
  }

  farmWithAccount(accountName: string, sac: SteamAccountClient) {
    const [cantFarm] = this.checkIfCanFarm()
    if (cantFarm) return bad(cantFarm)

    if (this.isAccountAdded(accountName)) {
      return bad(
        new Fail({
          code: this.codify(EAppResults["ACCOUNT-ALREADY-FARMING"]),
          httpStatus: 403,
          payload: {
            givenAccountName: accountName,
            farmingAccounts: this.getFarmingAccountsNameList(),
          },
        })
      )
    } else {
      this.farmWithAccountImpl(accountName)
    }
    return nice(null)
  }

  isAccountFarming(accountName: string): boolean {
    return this.farmingAccounts.has(accountName)
  }

  isAccountAdded(accountName: string): boolean {
    return this.farmingAccounts.has(accountName)
  }
}
