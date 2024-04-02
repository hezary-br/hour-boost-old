import { type DataOrError, Fail, type PlanType, type PlanUsage, type Usage } from "core"

import { UserCompleteFarmSessionCommand, UserHasStartFarmingCommand } from "~/application/commands"
import type { EventEmitter, UserClusterEvents } from "~/application/services"
import {
  type AccountStatusList,
  FarmService,
  type NSFarmService,
  type PauseFarmOnAccountUsage,
} from "~/application/services/FarmService"
import { SteamAccountClient } from "~/application/services/steam"
import { EAppResults } from "~/application/use-cases"
import type { Publisher } from "~/infra/queue"
import { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { bad, nice } from "~/utils/helpers"

export const FARMING_INTERVAL_IN_SECONDS = 1

export type FarmingAccountDetails = {
  usageAmountInSeconds: number
  status: AccountFarmingStatus
  sac: SteamAccountClient
}
type AccountFarmingStatus = "FARMING" | "IDDLE"

export type FarmingAccountDetailsWithAccountName = FarmingAccountDetails & {
  accountName: string
}

export class FarmUsageService extends FarmService {
  private readonly codify = <const T extends string = string>(moduleCode: T) =>
    `[FarmUsageService]:${moduleCode}` as const

  readonly accountsFarming = new Map<string, FarmingAccountDetails>()
  type: PlanType = "USAGE"
  private FARMING_GAP = FARMING_INTERVAL_IN_SECONDS
  private farmingInterval: NodeJS.Timeout | undefined
  private usageLeft: number
  readonly initialUsageLeft: number
  readonly emitter: EventEmitter<UserClusterEvents>
  readonly usageBuilder = new UsageBuilder()

  constructor(props: FarmUsageServiceProps) {
    super({
      planId: props.plan.id_plan,
      startedAt: props.farmStartedAt,
      userId: props.plan.ownerId,
      username: props.username,
      publisher: props.publisher,
    })
    this.usageLeft = props.plan.getUsageLeft()
    this.initialUsageLeft = props.plan.getUsageLeft()
    this.emitter = props.emitter

    this.emitter.on("service:max-usage-exceeded", () => {
      console.log("1. ouviu `service:max-usage-exceeded`: chamando stopFarmAllAccounts")
      this.stopFarmAllAccounts({ isFinalizingSession: true })
    })
  }

  getAccountDetails(accountName: string) {
    return this.accountsFarming.get(accountName) ?? null
  }

  protected resumeFarming(accountName: string) {
    this.setAccountStatus(accountName, "FARMING")
  }

  isAccountAdded(accountName: string) {
    return !!this.getAccountDetails(accountName)
  }

  getActiveFarmingAccountsAmount() {
    return this.getActiveFarmingAccounts().length
  }

  hasAccountsFarming(): boolean {
    return this.getActiveFarmingAccountsAmount() > 0
  }

  getFarmingAccounts(): DataOrError<NSFarmService.GetFarmingAccounts> {
    const accountStatus = {} as NSFarmService.GetFarmingAccounts
    for (const [accountName, details] of this.accountsFarming) {
      accountStatus[accountName] = details.status
    }

    return [null, accountStatus]
  }

  private getActiveFarmingAccounts() {
    const res = Array.from(this.accountsFarming).filter(([_, details]) => details.status === "FARMING")
    return res
  }

  farmWithAccount(accountName: string, sac: SteamAccountClient) {
    const [error] = this.farmWithAccountImpl(accountName)
    if (error) return bad(error)

    console.log(`farm-service: is ${accountName} added? `, this.isAccountAdded(accountName))
    if (!this.isAccountAdded(accountName)) {
      console.log(
        `Since the ${accountName} is not added, I'm appending this account again with the status 'FARMING'`
      )
    }
    if (this.isAccountAdded(accountName)) this.resumeFarming(accountName)
    else this.appendAccount(accountName, sac)
    return nice(null)
  }

  protected appendAccount(accountName: string, sac: SteamAccountClient) {
    this.accountsFarming.set(accountName, {
      usageAmountInSeconds: 0,
      status: "FARMING",
      sac,
    })
  }

  private setAccountStatus(accountName: string, status: "FARMING" | "IDDLE") {
    const account = this.getAccountDetails(accountName)
    if (!account) return
    // if (!account) {
    //   const msg = `NSTH: Tried to resume farming on account that don't exists. ${accountName}`
    //   throw new ApplicationError(msg, 500)
    // }
    this.accountsFarming.set(accountName, {
      ...account,
      status,
    })

    // account = {
    //   ...account,
    //   status,
    // }
  }

  private stopFarmImpl() {
    const when = new Date()
    this.status = "IDDLE"
    this.accountsFarming.forEach(acc => {
      acc.status = "IDDLE"
    })
    const usages = this.getFarmingAccountDetails().map(accountDetails => {
      return this.usageBuilder.create({
        accountName: accountDetails.accountName,
        amountTime: accountDetails.usageAmountInSeconds,
        createdAt: when,
        plan_id: this.planId,
        user_id: this.userId,
      })
    })
    clearInterval(this.farmingInterval)
    return { usages }
  }

  protected stopFarm(isFinalizingSession: boolean): void {
    for(const [, details] of this.accountsFarming) {
      details.sac.stopFarm()
    }
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
    clearInterval(this.farmingInterval)
  }

  protected stopFarmSync(): Usage[] {
    const { usages } = this.stopFarmImpl()
    return usages
  }

  isAccountFarming(accountName: string): boolean {
    const acc = this.accountsFarming.get(accountName)
    return !!(acc?.status === "FARMING")
  }

  pauseFarmOnAccountSync(accountName: string, isFinalizingSession?: boolean) {
    if (this.getActiveFarmingAccountsAmount() === 1) {
      const usages = this.stopFarmSync()
      return nice({
        planId: this.planId,
        type: "STOP-ALL",
        usages,
        accountNameList: this.getFarmingAccountsNameList(),
      })
    }
    this.setAccountStatus(accountName, "IDDLE")
    return nice({ planId: this.planId, type: "STOP-SILENTLY", accountName })
  }

  private getFarmingAccountDetails(): FarmingAccountDetailsWithAccountName[] {
    const farmingAccountDetails = [] as FarmingAccountDetailsWithAccountName[]
    for (const [accountName, details] of this.accountsFarming) {
      farmingAccountDetails.push({
        accountName,
        usageAmountInSeconds: details.usageAmountInSeconds,
        status: details.status,
        sac: details.sac,
      })
    }
    return farmingAccountDetails
  }

  pauseFarmOnAccount(accountName: string, isFinalizingSession: boolean) {
    if (this.getActiveFarmingAccountsAmount() === 1) {
      this.stopFarm(isFinalizingSession)
    }
    this.setAccountStatus(accountName, "IDDLE")
    return nice(null)
  }

  publishCompleteFarmSession(pauseFarmCategory: PauseFarmOnAccountUsage, isFinalizingSession: boolean): void {
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
    return Array.from(this.accountsFarming.keys())
  }

  checkIfCanFarm() {
    if (this.usageLeft <= 0) {
      return bad(
        new Fail({
          code: this.codify(EAppResults["PLAN-MAX-USAGE-EXCEEDED"]),
          httpStatus: 403,
          payload: {
            usageLeft: this.getUsageLeft(),
            currentUsage: this.getUsageLeft(),
          },
        })
      )
    }

    return nice()
  }

  startFarm() {
    this.status = "FARMING"
    const [cantFarm] = this.checkIfCanFarm()
    if (cantFarm) return bad(cantFarm)

    this.farmingInterval = setInterval(() => {
      const allAccountsFarmedTotalAmount = this.FARMING_GAP * this.getActiveFarmingAccountsAmount()
      const individualAccountFarmedAmount = this.FARMING_GAP

      if (this.usageLeft - allAccountsFarmedTotalAmount < 0) {
        this.emitter.emit("service:max-usage-exceeded")
        clearInterval(this.farmingInterval)
        return
      }
      // this.sharedUsageLeft.farm(this.FARMING_GAP)
      this.usageLeft -= allAccountsFarmedTotalAmount
      this.addUsageToAccount(individualAccountFarmedAmount)
    }, this.FARMING_GAP * 1000).unref()

    this.publisher.publish(
      new UserHasStartFarmingCommand({
        when: new Date(),
        planId: this.planId,
        userId: this.userId,
      })
    )

    return nice(null)
  }

  getUsageLeft() {
    return this.usageLeft
  }

  getAccountsStatus(): AccountStatusList {
    const accountStatus: AccountStatusList = {}
    for (const [accountName, details] of this.accountsFarming) {
      accountStatus[accountName] = details.status
    }
    return accountStatus
  }

  farmWithAccountImpl(accountName: string) {
    if (this.getActiveFarmingAccountsAmount() === 0) {
      this.publisher.publish(
        new UserHasStartFarmingCommand({
          planId: this.planId,
          userId: this.userId,
          when: new Date(),
        })
      )
      return this.startFarm()
    }
    return nice(null)
  }

  private addUsageToAccount(usageAmount: number) {
    for (const [_, acc] of this.accountsFarming) {
      if (acc.status === "FARMING") acc.usageAmountInSeconds += usageAmount
    }
  }
}

type FarmUsageServiceProps = {
  publisher: Publisher
  plan: PlanUsage
  username: string
  farmStartedAt: Date
  emitter: EventEmitter<UserClusterEvents>
}
