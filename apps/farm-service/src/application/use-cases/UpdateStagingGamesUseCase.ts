import {
  type DataOrFail,
  Fail,
  type SteamAccountClientStateCacheRepository,
  type UsersRepository,
} from "core"
import type { AllUsersClientsStorage, UsersSACsFarmingClusterStorage } from "~/application/services"
import { EAppResults } from "~/application/use-cases"
import type { StagingGamesListService } from "~/domain/services"
import type { FailGeneric } from "~/types/EventsApp.types"
import { bad, nice } from "~/utils/helpers"

export class UpdateStagingGamesUseCase implements IUpdateStagingGamesUseCase {
  constructor(
    private readonly stagingGamesListService: StagingGamesListService,
    private readonly usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage,
    private readonly usersRepository: UsersRepository,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly allUsersClientsStorage: AllUsersClientsStorage
  ) {}

  async execute({ newGameList, userId, accountName }: UpdateStagingGamesUseCasePayload) {
    const user = await this.usersRepository.getByID(userId)

    if (!user) {
      const fail = new Fail({
        code: EAppResults["USER-NOT-FOUND"],
        httpStatus: 404,
        payload: {
          givenUserId: userId,
          foundUser: user,
        },
      })
      return bad(fail)
    }

    const [errorFindingUserCluster, userCluster] = this.usersSACsFarmingClusterStorage.get(user.username)
    if (errorFindingUserCluster)
      return bad(
        new Fail({
          code: errorFindingUserCluster.code,
          httpStatus: errorFindingUserCluster.httpStatus,
          payload: errorFindingUserCluster.payload,
        })
      )

    const sac = this.allUsersClientsStorage.getAccountClient(userId, accountName)
    if (!sac) {
      const fail = new Fail({
        code: EAppResults["SAC-NOT-FOUND"],
        httpStatus: 404,
        payload: {
          givenAccountName: accountName,
          sacList: this.allUsersClientsStorage.listUsersKeys(),
        },
      })
      return bad(fail)
    }

    const [errorUpdatingStagingGameList] = await this.stagingGamesListService.update({
      newGameList,
      plan: user.plan,
      sac,
    })

    if (errorUpdatingStagingGameList) return bad(errorUpdatingStagingGameList)

    await this.steamAccountClientStateCacheRepository.save(sac.getCache())

    return nice(sac.getCache())
  }
}

// new UpdateStagingGamesUseCase().execute().then(res => {
//   const [error, value] = res
//   error?.code === ""
// })

export type UpdateStagingGamesUseCasePayload = {
  newGameList: number[]
  userId: string
  accountName: string
}

interface IUpdateStagingGamesUseCase {
  execute(...args: any[]): Promise<DataOrFail<FailGeneric>>
}
