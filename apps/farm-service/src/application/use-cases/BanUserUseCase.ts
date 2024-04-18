import {
  DataOrFail,
  Fail,
  PlanRepository,
  SteamAccountClientStateCacheRepository,
  type UsersRepository,
} from "core"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import { RemoveSteamAccount } from "~/features/remove-steam-account/domain"
import { bad, nice } from "~/utils/helpers"

export class BanUserUseCase implements IBanUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly removeSteamAccount: RemoveSteamAccount,
    private readonly planRepository: PlanRepository,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
  ) {}

  async execute(banningUserId: string) {
    const [error, user] = await getUser(this.usersRepository, banningUserId)
    if (error) return bad(error)
    user.ban()

    let errors = []
    for (const account of user.steamAccounts.data) {
      const [errorRemovingSteamAccount, info] = this.removeSteamAccount.execute({
        accountName: account.credentials.accountName,
        user,
      })

      if (errorRemovingSteamAccount) return bad(errorRemovingSteamAccount)

      const { stopFarmUsages } = info

      if (stopFarmUsages) {
        const [errorPersistingUsages] = await persistUsagesOnDatabase(stopFarmUsages, this.planRepository)
        if (errorPersistingUsages) {
          errors.push(
            new Fail({
              code: `PERSISTING-USAGES::${errorPersistingUsages.code ?? "UNKNOWN"}`,
              httpStatus: errorPersistingUsages.httpStatus,
              payload: errorPersistingUsages.payload,
            })
          )
        }
      }
      await this.steamAccountClientStateCacheRepository.deleteAllEntriesFromAccount(
        account.credentials.accountName
      )
    }

    if (errors.length) return bad(Fail.create("LIST::REMOVING-ACCOUNTS", 400, { errors }))

    await this.usersRepository.update(user)

    return nice()
  }
}

interface IBanUserUseCase {
  execute(banningUserId: string): Promise<DataOrFail<Fail>>
}
