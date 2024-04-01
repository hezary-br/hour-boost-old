import type { ApplicationError, DataOrFail, Fail, PlanRepository } from "core"
import { StopFarmDomain } from "~/features/stop-farm/domain"
import { bad, nice } from "~/utils/helpers"
import { persistUsagesOnDatabase } from "../utils/persistUsagesOnDatabase"

type Options = {
  persistUsages: boolean
}

export class StopFarmUseCase implements IStopFarmUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly stopFarmDomain: StopFarmDomain
  ) {}

  async execute(
    { planId, accountName, username, isFinalizingSession }: StopFarmUseCasePayload,
    options = { persistUsages: true } as Options
  ) {
    const [errorStoppingFarmDomain, data] = this.stopFarmDomain.execute({
      accountName,
      isFinalizingSession,
      username,
    })

    if (errorStoppingFarmDomain) return bad(errorStoppingFarmDomain)
    const { usages } = data

    if (options.persistUsages) {
      const [errorPersisting] = await persistUsagesOnDatabase(usages, this.planRepository)
      if (errorPersisting) return bad(errorPersisting)
    }

    return nice({ usages, planId })
  }
}

export type StopFarmUseCasePayload = {
  planId: string
  username: string
  accountName: string
  isFinalizingSession: boolean
}

interface IStopFarmUseCase {
  execute(...args: any[]): Promise<DataOrFail<ApplicationError | Fail, object>>
}
