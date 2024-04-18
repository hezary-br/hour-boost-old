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
import { GetError, bad, nice } from "~/utils/helpers"

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

    let errorList_removing_sa = [] as Array<GetError<RemoveSteamAccount["execute"]>>
    let errorList_persisting: Error_Persisting[] = []
    let count = 0
    ;[...user.steamAccounts.data].forEach(async account => {
      const [errorRemovingSteamAccount, info] = this.removeSteamAccount.execute({
        accountName: account.credentials.accountName,
        user,
      })

      if (errorRemovingSteamAccount) return errorList_removing_sa.push(errorRemovingSteamAccount)

      const { stopFarmUsages } = info

      if (stopFarmUsages) {
        const [errorPersistingUsages] = await persistUsagesOnDatabase(stopFarmUsages, this.planRepository)
        if (errorPersistingUsages) {
          errorList_persisting.push(createError_persisting(errorPersistingUsages))
        }
      }
      await this.steamAccountClientStateCacheRepository.deleteAllEntriesFromAccount(
        account.credentials.accountName
      )
      count++
    })

    if (errorList_removing_sa.length)
      return bad(Fail.create("LIST::REMOVING-ACCOUNTS", 400, { errors: errorList_removing_sa }))
    if (errorList_persisting.length)
      return bad(Fail.create("LIST::PERSISTING-USAGES", 400, { errors: errorList_persisting }))

    await this.usersRepository.update(user)

    return nice()
  }
}

interface IBanUserUseCase {
  execute(banningUserId: string): Promise<DataOrFail<Fail>>
}

function createError_persisting(error: GetError<typeof persistUsagesOnDatabase>) {
  return new Fail({
    code: `PERSISTING-USAGES::${error.code ?? "UNKNOWN"}`,
    httpStatus: error.httpStatus,
    payload: error.payload,
  })
}

type Error_Persisting = ReturnType<typeof createError_persisting>
