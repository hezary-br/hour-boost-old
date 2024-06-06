import { DataOrFail, EditablePlan, SteamAccountClientStateCacheRepository, UsersRepository } from "core"
import { uc } from "~/application/use-cases/helpers"
import { appendStopFarmUsageToPlan } from "~/application/utils/persistUsagesOnDatabase"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"

export class AddMoreGamesToPlanUseCase implements IAddMoreGamesToPlanUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly flushUpdateSteamAccountDomain: FlushUpdateSteamAccountDomain,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
  ) {}

  async execute({ mutatingUserId, newMaxGamesAllowed }: AddMoreGamesToPlanUseCasePayload) {
    const [errorGettingUser, user] = await uc.getUser(this.usersRepository, mutatingUserId)
    if (errorGettingUser) return bad(errorGettingUser)

    const editablePlan = new EditablePlan(user.plan)
    editablePlan.setMaxGamesAmount(newMaxGamesAllowed)

    const [error, data] = await this.flushUpdateSteamAccountDomain.execute({
      user,
      plan: user.plan,
      isFinalizingSession: false,
    })
    if (error) return bad(error)
    const { resetFarmResultList, updatedCacheStates } = data
    // if (errorResetingFarm)
    //   return bad(Fail.create(EAppResults["LIST::COULD-NOT-RESET-FARM"], 400, errorResetingFarm))

    const usagesToPersist = resetFarmResultList.map(s => s?.usages).filter(nonNullable)

    for (const usage of usagesToPersist) {
      appendStopFarmUsageToPlan(usage, user.plan)
    }

    for (const state of updatedCacheStates) {
      await this.steamAccountClientStateCacheRepository.save(state)
    }

    await this.usersRepository.update(user)

    return nice(user)
  }
}

export type AddMoreGamesToPlanUseCasePayload = {
  mutatingUserId: string
  newMaxGamesAllowed: number
}

interface IAddMoreGamesToPlanUseCase {
  execute(...args: any[]): Promise<DataOrFail<any>>
}
