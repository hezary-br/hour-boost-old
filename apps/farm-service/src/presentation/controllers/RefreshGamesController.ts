import { type API_GET_RefreshAccountGames, ApplicationError, type HttpClient } from "core"
import type {
  RefreshGamesUseCase,
  RefreshGamesUseCaseProps,
} from "~/presentation/presenters/RefreshGamesUseCase"

export class RefreshGamesController {
  constructor(private readonly refreshGamesUseCase: RefreshGamesUseCase) {}

  async handle({ payload }: HttpClient.Request<RefreshGames.Payload>) {
    const input: RefreshGamesUseCaseProps = {
      accountName: payload.accountName,
      userId: payload.userId,
    }
    const [error, accountSteamGamesList] = await this.refreshGamesUseCase.execute(input)
    if (error) {
      if (error instanceof ApplicationError) throw error
      return {
        json: {
          code: error.code,
          message: "Você precisa informar o Steam Guard primeiro.",
        },
        status: 403,
      }
    }
    return {
      status: 200,
      json: {
        games: accountSteamGamesList.toJSON(),
      } satisfies API_GET_RefreshAccountGames,
    }
  }
}

export namespace RefreshGames {
  export type Payload = {
    userId: string
    accountName: string
  }
}
