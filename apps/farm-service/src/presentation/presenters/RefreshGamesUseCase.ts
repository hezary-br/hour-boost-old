import type { SteamAccountClientStateCacheRepository } from "core"
import type { AllUsersClientsStorage } from "~/application/services"

export class RefreshGamesUseCase {
  constructor(
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly allUsersClientsStorage: AllUsersClientsStorage
  ) {}

  async execute({ accountName, userId }: RefreshGamesUseCaseProps) {
    const sac = this.allUsersClientsStorage.getAccountClientOrThrow(userId, accountName)
    const [error, accountSteamGamesList] = await sac.getAccountGamesList()
    if (error) return [error] as const
    await this.steamAccountClientStateCacheRepository.setAccountGames(accountName, accountSteamGamesList)
    return [null, accountSteamGamesList] as const
  }
}

export type RefreshGamesUseCaseProps = {
  accountName: string
  userId: string
}
