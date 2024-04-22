import type { DataOrFail, GetError, User } from "core"
import { nice } from "~/utils/helpers"
import type { FarmSession } from "../services"
import type { StopFarmUseCase } from "./StopFarmUseCase"

export class StopFarmOnUserAllAccounts implements IStopFarmOnUserAllAccounts {
  constructor(private readonly stopFarmUseCase: StopFarmUseCase) {}

  async execute(user: User, onError?: (error: GetError<StopFarmUseCase["execute"]>) => void) {
    const farmSessionList: FarmSession[] = []
    for (const steamAccount of user.steamAccounts.data) {
      const [errorStoppingFarm, usagesInfo] = await this.stopFarmUseCase.execute(
        {
          accountName: steamAccount.credentials.accountName,
          username: user.username,
          isFinalizingSession: true,
        },
        {
          persistUsages: false,
        }
      )

      if (errorStoppingFarm && onError) {
        onError(errorStoppingFarm)
      }

      if (usagesInfo?.usages) {
        farmSessionList.push(usagesInfo.usages)
      }
    }

    return nice(farmSessionList)
  }
}

export type StopFarmOnUserAllAccountsPayload = {}

interface IStopFarmOnUserAllAccounts {
  execute(...args: any[]): Promise<DataOrFail<null, any[]>>
}
