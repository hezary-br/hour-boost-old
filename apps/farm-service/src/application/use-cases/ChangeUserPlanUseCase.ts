import {
  type DataOrFail,
  Fail,
  type GetError,
  type PlanAllNames,
  PlanRepository,
  type SteamAccountClientStateCacheRepository,
  type User,
  type UsersRepository,
} from "core"
import { UserChangedPlanCommand } from "~/application/commands/steam-client/UserChangedPlanCommand"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import type { PlanService } from "~/domain/services/PlanService"
import type { UserService } from "~/domain/services/UserService"
import { TrimSteamAccounts, batchOperations } from "~/domain/utils/trim-steam-accounts"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { Publisher } from "~/infra/queue"
import { getUserSACs_OnStorage_ByUser } from "~/utils/getUser"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"
import type { RestoreAccountSessionUseCase } from "."
import type { AllUsersClientsStorage, FarmSession } from "../services"

export class ChangeUserPlanUseCase implements IChangeUserPlanUseCase {
  constructor(
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly usersRepository: UsersRepository,
    private readonly planService: PlanService,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly restoreAccountSessionUseCase: RestoreAccountSessionUseCase,
    private readonly userService: UserService,
    private readonly trimSteamAccounts: TrimSteamAccounts,
    private readonly planRepository: PlanRepository,
    private readonly publisher: Publisher,
    private readonly flushUpdateSteamAccountDomain: FlushUpdateSteamAccountDomain
  ) {}

  private async executeImpl({ user, newPlanName }: ChangeUserPlanUseCasePayload) {
    const [errorChangingPlan, newPlan] = this.planService.createPlan({ currentPlan: user.plan, newPlanName })
    if (errorChangingPlan) return bad(errorChangingPlan)

    const [errorGettingUserSACList, userSacList = []] = getUserSACs_OnStorage_ByUser(
      user,
      this.allUsersClientsStorage
    )
    if (errorGettingUserSACList && errorGettingUserSACList?.code !== "USER-STORAGE-NOT-FOUND") {
      return bad(Fail.create(errorGettingUserSACList.code, 400))
    }

    const [errorTrimmingSteamAccounts, trimSteamAccountsInfo] = this.trimSteamAccounts.execute({
      user,
      plan: newPlan,
    })
    if (errorTrimmingSteamAccounts) return bad(errorTrimmingSteamAccounts)

    user.assignPlan(newPlan)
    const [errorFlushUpdatingFarm, result] = await this.flushUpdateSteamAccountDomain.execute({
      user,
      plan: newPlan,
    })
    if (errorFlushUpdatingFarm) return bad(errorFlushUpdatingFarm)
    const { resetFarmResultList, updatedCacheStates } = result

    const usagesToPersist: FarmSession[] = [
      ...resetFarmResultList.map(data => data?.usages).filter(nonNullable),
      ...trimSteamAccountsInfo.trimmingAccountsResults.map(data => data.stopFarmUsages).filter(nonNullable),
    ]

    const [errorPersistingUsages] = batchOperations(
      await Promise.all(
        usagesToPersist.map(async usages => {
          return await persistUsagesOnDatabase(usages, this.planRepository)
        })
      )
    )
    if (errorPersistingUsages)
      return bad(Fail.create("COULD-NOT-PERSIST-ACCOUNT-USAGE", 400, errorPersistingUsages))

    const fails: Fail[] = []

    const updatedCacheStatesFiltered = updatedCacheStates.filter(c =>
      user.steamAccounts.data.map(sa => sa.credentials.accountName).includes(c.accountName)
    )
    for (const state of updatedCacheStatesFiltered) {
      await this.steamAccountClientStateCacheRepository.save(state)
      const [error] = await this.restoreAccountSessionUseCase.execute({
        plan: newPlan,
        sac: userSacList.find(sac => sac.accountName === state.accountName)!,
        username: user.username,
        state,
      })
      switch (error?.code) {
        case "KNOWN-ERROR":
        case "OTHER-SESSION-STILL-ON":
        case "[RestoreAccountSessionUseCase]::PLAN-NOT-FOUND":
        case "[RestoreAccountSessionUseCase]::[FarmInfinityService]:ACCOUNT-ALREADY-FARMING":
        case "[FarmUsageService]:PLAN-MAX-USAGE-EXCEEDED":
          continue
        case "cluster.farmWithAccount()::UNKNOWN-CLIENT-ERROR":
        case "[RestoreAccountSessionUseCase]::SAC-NOT-FOUND":
        case "[RestoreAccountSessionUseCase]::UNKNOWN-CLIENT-ERROR":
        case "UNKNOWN-APPLICATION-ERROR":
        case "UNKNOWN-CLIENT-ERROR":
          fails.push(error)
          continue
        default:
          error satisfies null
      }
      // if (error && error?.code !== "[RestoreAccountSessionUseCase]::SAC-NOT-LOGGED") fails.push(error)
    }

    if (fails.length) {
      console.log("NSTH: had a list to restore account session, but some failed", fails)
      return bad(Fail.create("LIST::UPDATING-CACHE", 400, fails))
    }

    await this.usersRepository.update(user)
    this.publisher.publish(new UserChangedPlanCommand({ when: new Date(), user }))
    for (const accountName of trimSteamAccountsInfo.trimmingAccountsName) {
      await this.steamAccountClientStateCacheRepository.deleteAllEntriesFromAccount(accountName)
    }
    return nice()
  }

  async execute(props: ChangeUserPlanUseCasePayload) {
    const [error, result] = await this.executeImpl(props)
    if (error) {
      return this.handleFail(error, props)
    }
    return nice(result)
  }

  handleFail(error: GetError<ChangeUserPlanUseCase["executeImpl"]>, props: ChangeUserPlanUseCasePayload) {
    switch (error.code) {
      case "LIST::TRIMMING-ACCOUNTS":
      case "LIST::UPDATING-CACHE":
      case "LIST::COULD-NOT-RESET-FARM":
      case "COULD-NOT-PERSIST-ACCOUNT-USAGE":
        return bad(error)
    }
  }
}

export type ChangeUserPlanUseCasePayload = {
  user: User
  newPlanName: PlanAllNames
}

interface IChangeUserPlanUseCase {
  execute(...args: any[]): Promise<DataOrFail<Fail>>
  handleFail(...args: any[]): DataOrFail<any>
}
