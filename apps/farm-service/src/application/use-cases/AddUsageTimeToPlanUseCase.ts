import {
  DataOrFail,
  EditablePlan,
  EditablePlanUsage,
  Fail,
  PlanInfinity,
  PlanRepository,
  SteamAccountClientStateCacheRepository,
  UsersRepository,
} from "core"
import { uc } from "~/application/use-cases/helpers"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"

export class AddUsageTimeToPlanUseCase implements IAddUsageTimeToPlanUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly flushUpdateSteamAccountDomain: FlushUpdateSteamAccountDomain,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly planRepository: PlanRepository
  ) {}

  async execute({ mutatingUserId, usageTimeInSeconds }: AddUsageTimeToPlanUseCasePayload) {
    const [errorGettingUser, user] = await uc.getUser(this.usersRepository, mutatingUserId)
    if (errorGettingUser) return bad(errorGettingUser)

    if (user.plan instanceof PlanInfinity) {
      return bad(Fail.create("PLAN-IS-INFINITY", 403, { userPlan: user.plan, usageTimeInSeconds }))
    }

    const editablePlan = new EditablePlanUsage(user.plan, new EditablePlan(user.plan))
    editablePlan.addMoreUsageTime(usageTimeInSeconds)
    const [errorFlushUpdating, data] = await this.flushUpdateSteamAccountDomain.execute({
      plan: user.plan,
      user,
    })
    if (errorFlushUpdating) return bad(errorFlushUpdating)

    const { resetFarmResultList, updatedCacheStates } = data

    for (const state of updatedCacheStates) {
      await this.steamAccountClientStateCacheRepository.save(state)
    }

    for (const { usages } of resetFarmResultList.filter(nonNullable)) {
      await persistUsagesOnDatabase(usages, this.planRepository)
    }

    await this.usersRepository.update(user)

    return nice(user)
  }
}

export type AddUsageTimeToPlanUseCasePayload = {
  mutatingUserId: string
  usageTimeInSeconds: number
}

interface IAddUsageTimeToPlanUseCase {
  execute(...args: any[]): Promise<DataOrFail<Fail>>
}
