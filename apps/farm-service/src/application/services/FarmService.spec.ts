let farmService: FarmService

import { type DataOrError, Fail, type PlanType, type Usage } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  validSteamAccounts,
} from "~/__tests__/instances"
import type { FarmingAccountDetails } from "~/application/services"
import { type AccountStatusList, FarmService, type NSFarmService } from "~/application/services/FarmService"
import { SteamAccountClient } from "~/application/services/steam"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { getSACOn_AllUsersClientsStorage_ByUserId } from "~/utils/getSAC"
import { bad, nice } from "~/utils/helpers"

const log = console.log
console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let meSACGetter = getSACOn_AllUsersClientsStorage_ByUserId(s.me.userId, i.allUsersClientsStorage)
let sac = () => meSACGetter(s.me.accountName)[1]!
let sac2 = () => meSACGetter(s.me.accountName2)[1]!
let sac3 = () => meSACGetter(s.me.accountName3)[1]!

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  farmService = new FarmServiceImpl({
    startedAt: new Date("2023-06-10T10:00:00Z"),
    planId: meInstances.me.plan.id_plan,
    userId: meInstances.me.id_user,
    username: meInstances.me.username,
    publisher: i.publisher,
  })
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

beforeEach(() => {})

describe("FarmService test suite", () => {
  test("should set the status to FARMING", async () => {
    expect(farmService.getServiceStatus()).toBe("IDDLE")
    farmService.farmWithAccount(s.me.accountName, sac())
    expect(farmService.getServiceStatus()).toBe("FARMING")
  })

  test("should add new account to the account list", async () => {
    expect(farmService.getActiveFarmingAccountsAmount()).toBe(0)
    expect(farmService.hasAccountsFarming()).toBe(false)
    farmService.farmWithAccount(s.me.accountName, sac())
    expect(farmService.getActiveFarmingAccountsAmount()).toBe(1)
    expect(farmService.hasAccountsFarming()).toBe(true)
  })

  test("should stop account", async () => {
    expect(farmService.hasAccountsFarming()).toBe(false)
    expect(farmService.getServiceStatus()).toBe("IDDLE")
    farmService.farmWithAccount(s.me.accountName, sac())
    expect(farmService.hasAccountsFarming()).toBe(true)
    expect(farmService.getServiceStatus()).toBe("FARMING")
    farmService.pauseFarmOnAccountSync(s.me.accountName, false)
    expect(farmService.hasAccountsFarming()).toBe(false)
    expect(farmService.getServiceStatus()).toBe("IDDLE")
  })

  test("should resume farming", async () => {
    farmService.farmWithAccount(s.me.accountName, sac())
    expect(farmService.hasAccountsFarming()).toBe(true)
    farmService.pauseFarmOnAccountSync(s.me.accountName, false)
    expect(farmService.hasAccountsFarming()).toBe(false)
    farmService.farmWithAccount(s.me.accountName, sac())
    expect(farmService.hasAccountsFarming()).toBe(true)
  })

  // test("should THROW if tried to stop account that was never registered", async () => {
  //   expect(() => {
  //     farmService.pauseFarmOnAccountSync(s.me.accountName, false)
  //   }).toThrow("NSTH: Tried to resume farming on account that don't exists.")
  // })

  test("should print farming accounts properly: 2 farming, 1 iddle", async () => {
    farmService.farmWithAccount(s.me.accountName, sac())
    farmService.farmWithAccount(s.me.accountName2, sac2())
    farmService.farmWithAccount(s.me.accountName3, sac3())
    farmService.pauseFarmOnAccountSync(s.me.accountName, false)
    const [errorGettingAccountStatus, accountsStatus] = farmService.getFarmingAccounts()
    expect(errorGettingAccountStatus).toBeNull()
    expect(accountsStatus).toStrictEqual({
      [s.me.accountName]: "IDDLE",
      [s.me.accountName2]: "FARMING",
      [s.me.accountName3]: "FARMING",
    })
  })
})

class FarmServiceImpl extends FarmService {
  checkIfCanFarm() {
    return nice()
  }
  protected getFarmingAccountsNameList(): string[] {
    return []
  }
  accountsFarming: Map<string, FarmingAccountDetails> = new Map()

  getActiveFarmingAccountsAmount(): number {
    return Array.from(this.accountsFarming).filter(([_, details]) => details.status === "FARMING").length
  }

  getFarmingAccounts(): DataOrError<NSFarmService.GetFarmingAccounts> {
    return [
      null,
      Array.from(this.accountsFarming).reduce((acc, [accountName, details]) => {
        acc[accountName] = details.status
        return acc
      }, {} as NSFarmService.GetFarmingAccounts),
    ]
  }

  isAccountFarming(accountName: string): boolean {
    return this.accountsFarming.has(accountName)
  }
  isAccountAdded(accountName: string): boolean {
    return this.accountsFarming.has(accountName)
  }
  hasAccountsFarming(): boolean {
    return this.getActiveFarmingAccountsAmount() > 0
  }
  farmWithAccount(accountName: string, sac: SteamAccountClient) {
    this.farmWithAccountImpl(accountName, sac)
    return nice(null)
  }
  pauseFarmOnAccount(accountName: string) {
    const account = this.accountsFarming.get(accountName)
    if (!account) return bad(Fail.create("ACCOUNT-NOT-FARMING", 403))
    this.accountsFarming.set(accountName, {
      ...account,
      status: "IDDLE",
    })
    return nice(null)
  }
  protected stopFarmSync(): Usage[] {
    this.accountsFarming.clear()
    return []
  }
  pauseFarmOnAccountSync(accountName: string) {
    if (this.accountsFarming.size === 1) {
      this.status = "IDDLE"
    }

    for (const [accountNameStr, acc] of this.accountsFarming) {
      if (accountNameStr === accountName) {
        acc.status = "IDDLE"
      }
    }
    return nice({
      planId: this.planId,
      type: "STOP-ALL",
      usages: [] as Usage[],
      accountNameList: [] as string[],
    })
  }
  getAccountsStatus(): AccountStatusList {
    const accountStatusList = {} as AccountStatusList
    return accountStatusList
  }
  protected publishCompleteFarmSession(): void {}

  farmWithAccountImpl(accountName: string, sac: SteamAccountClient) {
    if (this.accountsFarming.size === 0) {
      this.status = "FARMING"
    }
    this.accountsFarming.set(accountName, {
      status: "FARMING",
      usageAmountInSeconds: 0,
      sac: sac,
    })
    return nice()
  }

  type: PlanType = "USAGE"
  protected startFarm() {
    this.status = "FARMING"
    return nice()
  }
  protected stopFarm(): void {
    for (const [_, acc] of this.accountsFarming) {
      acc.status = "IDDLE"
    }
  }
}
