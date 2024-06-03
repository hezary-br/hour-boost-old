import { DataOrFail, Fail, PlanRepository, SteamAccountClientStateCacheRepository, User } from "core"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"

interface IFlushUpdateSteamAccountUseCase {
  execute(props: Input): Promise<DataOrFail<Fail>>
}

export class FlushUpdateSteamAccountUseCase implements IFlushUpdateSteamAccountUseCase {
  constructor(
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly planRepository: PlanRepository,
    private readonly flushUpdateSteamAccountDomain: FlushUpdateSteamAccountDomain
  ) {}

  async execute({ user }: Input) {
    const [errorFlushUpdating, data] = await this.flushUpdateSteamAccountDomain.execute({
      plan: user.plan,
      user,
      isFinalizingSession: false,
    })
    if (errorFlushUpdating) return bad(errorFlushUpdating)

    const { resetFarmResultList, updatedCacheStates } = data

    for (const state of updatedCacheStates) {
      await this.steamAccountClientStateCacheRepository.save(state)
    }

    for (const { usages } of resetFarmResultList.filter(nonNullable)) {
      await persistUsagesOnDatabase(usages, this.planRepository)
    }

    return nice()
  }
}

type Input = {
  user: User
}
