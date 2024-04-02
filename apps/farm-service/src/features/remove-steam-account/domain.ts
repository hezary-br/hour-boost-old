import { type DataOrFail, Fail, User } from "core"
import type {
  AllUsersClientsStorage,
  FarmSession,
  UsersSACsFarmingClusterStorage,
} from "~/application/services"
import { EAppResults } from "~/application/use-cases/RestoreAccountSessionUseCase"
import type { AutoRestarterScheduler } from "~/domain/cron"
import { bad, nice } from "~/utils/helpers"

export class RemoveSteamAccount implements IRemoveSteamAccount {
  constructor(
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage,
    private readonly autoRestarterScheduler: AutoRestarterScheduler
  ) {}

  execute({ user, accountName }: RemoveSteamAccountPayload) {
    const steamAccountIndex = user.steamAccounts.data.findIndex(
      acc => acc.credentials.accountName === accountName
    )
    if (steamAccountIndex < 0) {
      const fail = new Fail({
        code: EAppResults["STEAM-ACCOUNT-NOT-FOUND"],
        httpStatus: 404,
        payload: {
          foundSteamAccountsOnUser: user.steamAccounts.data.map(acc => acc.credentials.accountName),
          givenAccountName: accountName,
        },
      })

      return bad(fail)
    }

    const [errorFindingCluster, userCluster] = this.usersSACsFarmingClusterStorage.get(user.username)
    if (errorFindingCluster) return bad(errorFindingCluster)

    const isAccountFarming = userCluster.isAccountFarmingOnService(accountName)

    this.autoRestarterScheduler.stopCron(accountName)

    let farmSession: FarmSession | null = null
    if (isAccountFarming) {
      const [errorPausingFarmOnAccount, farmSessionResult] = userCluster.pauseFarmOnAccountSync({
        accountName,
        isFinalizingSession: true,
      })
      if (errorPausingFarmOnAccount) {
        return bad(
          new Fail({
            code: `PAUSE-FARM-ON-ACCOUNT::${errorPausingFarmOnAccount.code ?? "UNKNOWN"}`,
            httpStatus: errorPausingFarmOnAccount.httpStatus,
            payload: errorPausingFarmOnAccount.payload,
          })
        )
      }
      farmSession = farmSessionResult
    }

    const steamAccount = user.steamAccounts.data[steamAccountIndex]
    steamAccount.autoRelogin = false
    const [errorRemovingSteamAccount] = user.steamAccounts.remove(steamAccount.id_steamAccount)
    if (errorRemovingSteamAccount) return bad(errorRemovingSteamAccount)

    this.allUsersClientsStorage.removeSteamAccount(user.id_user, accountName)
    userCluster.removeSAC(accountName)
    return nice({
      stopFarmUsages: farmSession,
      user,
    })
  }
}

export type RemoveSteamAccountPayload = {
  accountName: string
  user: User
}

interface IRemoveSteamAccount {
  execute(...args: any[]): DataOrFail<Fail, Record<string, any>>
}
