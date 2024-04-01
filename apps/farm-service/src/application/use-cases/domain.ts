import {
  DataOrFail,
  Fail,
  GetError,
  GetResult,
  PlanRepository,
  SteamAccountClientStateCacheRepository,
  User,
} from "core"
import { AllUsersClientsStorage } from "~/application/services"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import { getUserSACs_OnStorage_ByUser_UpdateStates } from "~/utils/getUser"
import { bad, nice } from "~/utils/helpers"
import { ResetFarm } from "~/utils/resetFarm"

interface IFlushUpdateSteamAccountUseCase {
  execute(props: Input): Promise<DataOrFail<Fail>>
}

export class FlushUpdateSteamAccountUseCase implements IFlushUpdateSteamAccountUseCase {
  constructor(
    private readonly resetFarm: ResetFarm,
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly planRepository: PlanRepository
  ) {}

  async execute({ user }: Input) {
    const [error, updatedCacheStates] = getUserSACs_OnStorage_ByUser_UpdateStates(
      user,
      this.allUsersClientsStorage,
      user.plan
    )
    if (error) return bad(Fail.create(error.code, 400, error))

    for (const state of updatedCacheStates) {
      await this.steamAccountClientStateCacheRepository.save(state)
    }

    const errorsList: GetError<ResetFarm>[] = []
    const dataList: GetResult<ResetFarm>[] = []
    for (const steamAccount of user.steamAccounts.data) {
      const [errorReseting, data] = await this.resetFarm({
        accountName: steamAccount.credentials.accountName,
        userId: user.id_user,
        username: user.username,
        isFinalizingSession: false,
      })
      if (errorReseting) errorsList.push(errorReseting)
      else dataList.push(data)
    }
    if (errorsList.length) return bad(Fail.create("LIST:ERROR-RESETING-FARM", 400, { errorsList }))

    for (const data of dataList) {
      await persistUsagesOnDatabase(data.usages, this.planRepository)
    }

    return nice()
  }
}

type Input = {
  user: User
}
