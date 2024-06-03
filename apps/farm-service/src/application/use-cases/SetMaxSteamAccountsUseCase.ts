import {
  DataOrFail,
  EditablePlan,
  Fail,
  PlanRepository,
  SteamAccountClientStateCacheRepository,
  UsersRepository,
} from "core"
import { uc } from "~/application/use-cases/helpers"
import { appendStopFarmUsageToPlan } from "~/application/utils/persistUsagesOnDatabase"
import { TrimSteamAccounts } from "~/domain/utils/trim-steam-accounts"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"

export class SetMaxSteamAccountsUseCase implements ISetMaxSteamAccountsUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly flushUpdateSteamAccountDomain: FlushUpdateSteamAccountDomain,
    private readonly trimSteamAccounts: TrimSteamAccounts,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly planRepository: PlanRepository
  ) {}

  async execute({ mutatingUserId, newMaxSteamAccountsAllowed }: SetMaxSteamAccountsUseCasePayload) {
    const [errorGettingUser, user] = await uc.getUser(this.usersRepository, mutatingUserId)
    if (errorGettingUser) return bad(errorGettingUser)

    const editablePlan = new EditablePlan(user.plan)
    editablePlan.setMaxAccountsAmount(newMaxSteamAccountsAllowed)
    const [errorTrimmingAccounts, trimSteamAccountsInfo] = this.trimSteamAccounts.execute({
      user,
      plan: user.plan,
    })
    if (errorTrimmingAccounts) return bad(errorTrimmingAccounts)

    const [error, flushUpdateData] = await this.flushUpdateSteamAccountDomain.execute({
      user,
      plan: user.plan,
      isFinalizingSession: false,
    })
    if (error) return bad(error)

    const { resetFarmResultList, updatedCacheStates } = flushUpdateData

    const usagesToPersist = [
      ...resetFarmResultList.map(data => data?.usages).filter(nonNullable),
      ...trimSteamAccountsInfo.trimmingAccountsResults.map(data => data.stopFarmUsages).filter(nonNullable),
    ]

    for (const usage of usagesToPersist) {
      appendStopFarmUsageToPlan(usage, user.plan)
    }

    for (const state of updatedCacheStates) {
      await this.steamAccountClientStateCacheRepository.save(state)
    }

    for (const accountName of trimSteamAccountsInfo.trimmingAccountsName) {
      await this.steamAccountClientStateCacheRepository.deleteAllEntriesFromAccount(accountName)
    }
    await this.usersRepository.update(user)

    return nice(user)
  }
}

export type SetMaxSteamAccountsUseCasePayload = {
  mutatingUserId: string
  newMaxSteamAccountsAllowed: number
}

interface ISetMaxSteamAccountsUseCase {
  execute(...args: any[]): Promise<DataOrFail<Fail>>
}
