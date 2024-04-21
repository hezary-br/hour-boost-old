import type { UsersRepository } from "core"
import type { RestoreAccountConnectionUseCase } from "~/application/use-cases"
import { type FarmGamesController, promiseHandler } from "~/presentation/controllers"

export function makeFarmGames(farmGamesController: FarmGamesController) {
  return function farmGames(accountName: string, gamesID: number[], userId: string) {
    const response = promiseHandler(
      farmGamesController.handle({
        payload: {
          accountName,
          gamesID,
          userId,
        },
      })
    )

    return response
  }
}

export type TEST_FarmGames = ReturnType<typeof makeFarmGames>

export function makeRestoreAccountConnection(
  restoreAccountConnectionUseCase: RestoreAccountConnectionUseCase,
  usersRepository: UsersRepository
) {
  return async (userId: string, accountName: string) => {
    const user = (await usersRepository.getByID(userId))!
    const steamAccount = user.steamAccounts.getByAccountName(accountName)!
    const [errorRestoringConnection, restoreConnectionResult] = await restoreAccountConnectionUseCase.execute(
      {
        steamAccount: {
          accountName: steamAccount.credentials.accountName,
          autoRestart: steamAccount.autoRelogin,
          password: steamAccount.credentials.password,
          isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
        },
        user: {
          id: user.id_user,
          plan: user.plan,
          username: user.username,
        },
      }
    )

    expect(errorRestoringConnection).toBeNull()
    expect(restoreConnectionResult?.code).toBe("ACCOUNT-RELOGGED::CREDENTIALS")
  }
}

export type TEST_RestoreAccountConnection = ReturnType<typeof makeRestoreAccountConnection>
