import type { PlanRepository, SteamAccountClientStateCacheRepository } from "core"
import type { UserCompleteFarmSessionCommand } from "~/application/commands"
import type { AllUsersClientsStorage } from "~/application/services"
import { persistUsagesOnDatabase } from "~/application/utils/persistUsagesOnDatabase"
import type { EventNames, Observer } from "~/infra/queue"

export class PersistFarmSessionHandler implements Observer {
  operation: EventNames = "user-complete-farm-session"

  constructor(
    private readonly planRepository: PlanRepository,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly allUsersClientsStorage: AllUsersClientsStorage
  ) {}

  async notify({
    planId,
    farmSession,
    when,
    isFinalizingSession,
    userId,
  }: UserCompleteFarmSessionCommand): Promise<void> {
    const [errorPersistingUsages] = await persistUsagesOnDatabase(farmSession, this.planRepository)
    if (errorPersistingUsages) {
      return console.log(`[${when.toISOString()}]: Error persisting usages: `, farmSession)
    }
    if (isFinalizingSession) {
      const accountNameList =
        farmSession.type === "STOP-ALL" ? farmSession.accountNameList : [farmSession.accountName]
      const stopFarmOnCachePromises = accountNameList.map(async accountName => {
        const sac = this.allUsersClientsStorage.getAccountClient(userId, accountName)
        if (!sac) return Promise.resolve()
        await this.steamAccountClientStateCacheRepository.save(sac.getCache())
      })
      await Promise.all(stopFarmOnCachePromises)
      console.log(`Parando farm no cache nas contas [${accountNameList.join(", ")}]`)
    }
  }
}
