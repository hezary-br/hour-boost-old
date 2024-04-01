import {
  type DataOrFail,
  Fail,
  PlanRepository,
  SteamAccountClientStateCacheRepository,
  UsersRepository,
} from "core"
import { uc } from "~/application/use-cases/helpers"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import { RemoveSteamAccount } from "~/features/remove-steam-account/domain"
import { bad, nice } from "~/utils/helpers"

export class RemoveSteamAccountUseCase implements IRemoveSteamAccountUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly planRepository: PlanRepository,
    private readonly removeSteamAccount: RemoveSteamAccount
  ) {}

  async execute({ accountName, userId }: RemoveSteamAccountUseCasePayload) {
    const [errorGettingUser, user] = await uc.getUser(this.usersRepository, userId)
    if (errorGettingUser) return bad(errorGettingUser)

    const [errorRemovingSteamAccount, info] = this.removeSteamAccount.execute({
      accountName,
      user,
    })

    if (errorRemovingSteamAccount) return bad(errorRemovingSteamAccount)

    const { stopFarmUsages } = info

    // was farming
    if (stopFarmUsages) {
      const [errorPersistingUsages] = await persistUsagesOnDatabase(stopFarmUsages, this.planRepository)
      if (errorPersistingUsages) {
        return bad(
          new Fail({
            code: `PERSISTING-USAGES::${errorPersistingUsages.code ?? "UNKNOWN"}`,
            httpStatus: errorPersistingUsages.httpStatus,
            payload: errorPersistingUsages.payload,
          })
        )
      }
    }

    await this.usersRepository.update(user)
    await this.steamAccountClientStateCacheRepository.deleteAllEntriesFromAccount(accountName)
    return nice()
  }
}

export type RemoveSteamAccountUseCasePayload = {
  userId: string
  accountName: string
}

interface IRemoveSteamAccountUseCase {
  execute(...args: any[]): Promise<DataOrFail<Fail>>
}
