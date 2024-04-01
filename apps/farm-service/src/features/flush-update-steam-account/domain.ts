import { DataOrFail, Fail, PlanInfinity, PlanUsage, User } from "core"
import { AllUsersClientsStorage } from "~/application/services"
import { EAppResults } from "~/application/use-cases"
import { getUserSACs_OnStorage_ByUser_UpdateStates } from "~/utils/getUser"
import { bad, nice } from "~/utils/helpers"
import { ResetFarmEntities } from "~/utils/resetFarm"

export interface IFlushUpdateSteamAccountDomain {
  execute(props: FlushUpdateSteamAccountDomainProps): Promise<DataOrFail<Fail>>
}

type FlushUpdateSteamAccountDomainProps = {
  user: User
  plan: PlanUsage | PlanInfinity
}

export class FlushUpdateSteamAccountDomain implements IFlushUpdateSteamAccountDomain {
  constructor(
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly resetFarmEntities: ResetFarmEntities
  ) {}

  async execute({ user, plan }: FlushUpdateSteamAccountDomainProps) {
    const [error, updatedCacheStates] = getUserSACs_OnStorage_ByUser_UpdateStates(
      user,
      this.allUsersClientsStorage,
      plan
    )
    if (error) return bad(Fail.create(error.code, 400, error))

    const promises = updatedCacheStates.map(state => {
      return this.resetFarmEntities({
        state,
        userId: user.id_user,
        accountName: state.accountName,
        username: user.username,
        isFinalizingSession: false,
      })
    })

    const operationsResult = await Promise.all(promises)
    const operationsResultFailed = operationsResult.filter(([error]) => !!error).length
    if (operationsResultFailed)
      return bad(
        Fail.create(
          EAppResults["LIST::COULD-NOT-RESET-FARM"],
          400,
          operationsResult.map(([e]) => e)
        )
      )
    const resetFarmResultList = operationsResult.map(s => s[1])
    // const resetFarmResultList = batchOperations(operationsResult)

    return nice({ updatedCacheStates, resetFarmResultList })
  }
}
