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
import { TrimSteamAccounts } from "~/domain/utils/trim-steam-accounts"
import { FlushUpdateSteamAccountUseCase } from "~/features/flush-update-steam-account/use-case"
import { bad, nice } from "~/utils/helpers"

export class AddUsageTimeToPlanUseCase implements IAddUsageTimeToPlanUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly flushUpdateSteamAccountUseCase: FlushUpdateSteamAccountUseCase,
    private readonly trimSteamAccounts: TrimSteamAccounts,
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
    const [error] = await this.flushUpdateSteamAccountUseCase.execute({
      user,
    })
    if (error) return bad(error)

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
