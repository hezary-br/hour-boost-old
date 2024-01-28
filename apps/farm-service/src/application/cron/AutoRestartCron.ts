import { DataOrFail, Fail, PlanRepository, SteamAccountsRepository, UsersDAO } from "core"
import { AllUsersClientsStorage } from "~/application/services"
import { RestoreAccountConnectionUseCase, RestoreAccountSessionUseCase } from "~/application/use-cases"
import { bad, nice } from "~/utils/helpers"

export type AutoRestartCronPayload = {
  accountName: string
  forceRestoreSessionOnApplication?: boolean
}

interface IAutoRestartCron {
  run(...args: any[]): Promise<DataOrFail<Fail, AutoRestartResult>>
}

/**
 * bad: mata ciclo na hora
 * nice: analisa
 */
export class AutoRestartCron implements IAutoRestartCron {
  constructor(
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly planRepository: PlanRepository,
    private readonly steamAccountsRepository: SteamAccountsRepository,
    private readonly restoreAccountConnectionUseCase: RestoreAccountConnectionUseCase,
    private readonly restoreAccountSessionUseCase: RestoreAccountSessionUseCase,
    private readonly usersDAO: UsersDAO
  ) {}

  async run({ accountName, forceRestoreSessionOnApplication }: AutoRestartCronPayload) {
    const steamAccount = await this.steamAccountsRepository.getByAccountName(accountName)
    if (!steamAccount) {
      return bad(new Fail({ code: "STEAM_ACCOUNT_NOT_FOUND", payload: { steamAccount, accountName } }))
    }
    if (!steamAccount.ownerId) {
      return bad(new Fail({ code: "STEAM_ACCOUNT_IS_NOT_OWNED", payload: { steamAccount } }))
    }

    const user = await this.usersDAO.getByID(steamAccount.ownerId)
    if (!user) {
      return bad(new Fail({ code: "USER_NOT_FOUND", payload: { user } }))
    }

    const plan = await this.planRepository.getById(user.plan.id_plan)
    if (!plan) {
      return bad(new Fail({ code: "PLAN_NOT_FOUND", payload: { planId: user.plan.id_plan } }))
    }

    let sac = this.allUsersClientsStorage.getAccountClient(steamAccount.ownerId, accountName)

    if (!sac || !sac.logged) {
      const [errorRestoringConnection, result] = await this.restoreAccountConnectionUseCase.execute({
        steamAccount: {
          accountName,
          password: steamAccount.credentials.password,
          autoRestart:
            forceRestoreSessionOnApplication !== undefined
              ? forceRestoreSessionOnApplication
              : steamAccount.autoRelogin,
        },
        user: {
          id: user.id,
          username: user.username,
          plan,
        },
      })

      if (errorRestoringConnection) {
        return nice(
          new AutoRestartResult("ERROR_RESTORING_CONNECTION", true, {
            error: errorRestoringConnection,
          })
        )
      }

      const { sac: newSteamAccountClient } = result
      sac = newSteamAccountClient
    }

    const [errorRestoringSession] = await this.restoreAccountSessionUseCase.execute({
      accountName,
      plan,
      sac,
      username: user.username,
    })

    if (errorRestoringSession) {
      if ("fatal" in errorRestoringSession.payload) {
        return nice(
          new AutoRestartResult("ERROR_RESTORING_SESSION", errorRestoringSession.payload.fatal, {
            error: errorRestoringSession,
          })
        )
      }
      return bad(
        new Fail({
          code: errorRestoringSession.code,
          httpStatus: errorRestoringSession.httpStatus,
          payload: errorRestoringSession.payload,
        })
      )
    }

    return nice(new AutoRestartResult("RESTORED-SESSION", true, { success: true }))
  }
}

class AutoRestartResult<const TCode = string, const TData = any, const TFatal = boolean> {
  constructor(
    public code: TCode,
    public fatal: TFatal,
    public data: TData
  ) {}
}
