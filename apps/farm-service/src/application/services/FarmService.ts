const log = console.log

import type { DataOrError, DataOrFail, Fail, PlanType, Usage } from "core"
import type { FarmServiceStatus } from "~/application/services"
import { SteamAccountClient } from "~/application/services/steam"
import type { Publisher } from "~/infra/queue"

export type FarmServiceProps = {
  startedAt: Date
  planId: string
  userId: string
  username: string
  publisher: Publisher
}

// const something = {} as FarmInfinityService | FarmUsageService
// const [res] = something.pauseFarmOnAccountSync()

export abstract class FarmService {
  protected readonly publisher: Publisher
  abstract readonly type: PlanType
  protected status: FarmServiceStatus
  protected readonly planId: string
  protected readonly userId: string
  protected readonly username: string
  readonly startedAt: Date

  constructor(props: FarmServiceProps) {
    this.status = "IDDLE"
    this.startedAt = props.startedAt
    this.planId = props.planId
    this.userId = props.userId
    this.username = props.username
    this.publisher = props.publisher
  }

  abstract getAccountsStatus(): AccountStatusList

  abstract checkIfCanFarm(): DataOrFail<Fail>

  abstract getActiveFarmingAccountsAmount(): number
  abstract getFarmingAccounts(): DataOrError<NSFarmService.GetFarmingAccounts>
  abstract isAccountFarming(accountName: string): boolean
  abstract isAccountAdded(accountName: string): boolean
  abstract hasAccountsFarming(): boolean
  abstract farmWithAccount(accountName: string, sac: SteamAccountClient): DataOrFail<Fail>
  abstract farmWithAccountImpl(accountName: string, sac: SteamAccountClient): DataOrFail<Fail>

  getServiceStatus() {
    return this.status
  }

  stopFarmAllAccounts({ isFinalizingSession }: { isFinalizingSession: boolean }) {
    this.stopFarm(isFinalizingSession)
  }

  protected abstract publishCompleteFarmSession(farmSession: FarmSession, isFinalizingSession: boolean): void

  protected abstract getFarmingAccountsNameList(): string[]
  protected abstract startFarm(): DataOrFail<Fail>
  protected abstract stopFarm(isFinalizingSession: boolean): void
  protected abstract stopFarmSync(): Usage[]
  abstract pauseFarmOnAccount(accountName: string, isFinalizingSession: boolean): DataOrFail<Fail, null>
  abstract pauseFarmOnAccountSync(
    accountName: string,
    isFinalizingSession: boolean
  ): DataOrFail<Fail, FarmSession>

  getPlanId() {
    return this.planId
  }

  getUserId() {
    return this.userId
  }

  getUsername() {
    return this.username
  }
}

export type AccountStatusList = Record<string, "IDDLE" | "FARMING">

export type FarmSession =
  | NSFarmSessionCategory.StopSilently
  | NSFarmSessionCategory.StopAll
  | NSFarmSessionCategory.StopOne

export namespace NSFarmSessionCategory {
  export type StopSilently = {
    planId: string
    type: "STOP-SILENTLY"
    accountName: string
  }
  export type StopAll = {
    planId: string
    type: "STOP-ALL"
    usages: Usage[]
    accountNameList: string[]
  }
  export type StopOne = {
    planId: string
    type: "STOP-ONE"
    usage: Usage
    accountName: string
  }
}

export namespace NSFarmService {
  export type AccounStatus = "IDDLE" | "FARMING"
  export type GetFarmingAccounts = Record<string, AccounStatus>
}
