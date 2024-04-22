import type { SteamAccountClientStateCacheRepository } from "core"
import type { RefreshGamesUseCase } from "~/presentation/presenters/RefreshGamesUseCase"

export class GetUserSteamGamesUseCase {
  constructor(
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly refreshGamesUseCase: RefreshGamesUseCase
  ) {}

  async execute({ accountName, userId }: GetUserSteamGamesUseCaseProps) {
    const foundSteamGamesList = await this.steamAccountClientStateCacheRepository.getAccountGames(accountName)
    if (foundSteamGamesList) return [null, foundSteamGamesList] as const
    const [error, steamGamesList] = await this.refreshGamesUseCase.execute({
      accountName,
      userId,
    })
    if (error) return [error] as const
    return [null, steamGamesList] as const
  }
}

export type GetUserSteamGamesUseCaseProps = {
  accountName: string
  userId: string
}
