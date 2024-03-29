import { SteamAccountClientStateCacheRepository } from "core"
import { UserChangedPlanCommand } from "~/application/commands/steam-client/UserChangedPlanCommand"
import type { EventNames, Observer } from "~/infra/queue"

export class UpdateRefreshTokenPlanIdHandler implements Observer {
  operation: EventNames = "user-changed-plan"

  constructor(
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
  ) {}

  async notify(command: UserChangedPlanCommand): Promise<void> {
    const userAccountNames = command.user.steamAccounts.data.map(sa => sa.credentials.accountName)
    await Promise.all(
      userAccountNames.map(accountName => {
        return this.steamAccountClientStateCacheRepository.setRefreshTokenPlanId(
          accountName,
          command.user.plan.id_plan
        )
      })
    )
  }
}
