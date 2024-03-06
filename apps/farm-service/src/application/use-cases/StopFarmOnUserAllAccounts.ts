import { DataOrFail, GetError, PlanRepository, User } from "core"
import { nice } from "~/utils/helpers"
import { PauseFarmOnAccountUsage } from "../services"
import { StopFarmUseCase } from "./StopFarmUseCase"

export class StopFarmOnUserAllAccounts implements IStopFarmOnUserAllAccounts {
  constructor(private readonly stopFarmUseCase: StopFarmUseCase) {}

  async execute(user: User, onError?: (error: GetError<StopFarmUseCase["execute"]>) => void) {
    const usagesList: PauseFarmOnAccountUsage[] = []
    for (const steamAccount of user.steamAccounts.data) {
      const [errorStoppingFarm, usagesInfo] = await this.stopFarmUseCase.execute(
        {
          accountName: steamAccount.credentials.accountName,
          planId: user.plan.id_plan,
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
        usagesList.push(usagesInfo.usages)
      }
    }

    return nice(usagesList)
  }
}

export type StopFarmOnUserAllAccountsPayload = {}

interface IStopFarmOnUserAllAccounts {
  execute(...args: any[]): Promise<DataOrFail<null, any[]>>
}
