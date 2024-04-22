import type { DataOrFail, Fail } from "core"
import type { NSUserCluster, UsersSACsFarmingClusterStorage } from "~/application/services"
import type { SteamAccountClient } from "~/application/services/steam"
import { bad, nice } from "~/utils/helpers"

abstract class IFarmGamesUseCase {
  abstract execute(...args: any[]): Promise<DataOrFail<Fail>>
}

export class FarmGamesUseCase extends IFarmGamesUseCase {
  constructor(private readonly usersClusterStorage: UsersSACsFarmingClusterStorage) {
    super()
  }

  async execute({ username, accountName, sac, gamesId, planId, session }: FarmGamesUseCaseProps) {
    // const userCluster = this.usersClusterStorage.getOrAdd(username, plan)
    const [error, userCluster] = this.usersClusterStorage.get(username)
    if (error) return bad(error)
    const isAccountFarming = userCluster.isAccountFarmingOnService(accountName)
    if (!userCluster.hasSteamAccountClient(accountName) && !isAccountFarming) {
      userCluster.addSAC(sac)
    }
    const [errorFarmingWithAccount, result] = await userCluster.farmWithAccount({
      accountName,
      gamesId,
      planId,
      session,
    })
    if (errorFarmingWithAccount) return bad(errorFarmingWithAccount)
    return nice(result)
  }
}

type FarmGamesUseCaseProps = {
  username: string
  accountName: string
  sac: SteamAccountClient
  gamesId: number[]
  planId: string
  session: NSUserCluster.SessionType
}
