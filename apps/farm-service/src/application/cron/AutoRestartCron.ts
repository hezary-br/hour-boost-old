import { AsyncLocalStorage } from "node:async_hooks"
import type {
  DataOrFail,
  PlanRepository,
  SteamAccountClientStateCacheRepository,
  SteamAccountsRepository,
  UsersDAO,
} from "core"
import { Fail } from "core"
import type { AllUsersClientsStorage } from "~/application/services"
import {
  EAppResults,
  type RestoreAccountConnectionUseCase,
  type RestoreAccountSessionUseCase,
} from "~/application/use-cases"
import { ALS_username } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import type { FailGeneric } from "~/types/EventsApp.types"
import { bad, nice } from "~/utils/helpers"

export type AutoRestartCronPayload = {
  accountName: string
  forceRestoreSessionOnApplication: boolean
}

interface IAutoRestartCron {
  run(...args: any[]): Promise<DataOrFail<FailGeneric, AutoRestartResult>>
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
    private readonly usersDAO: UsersDAO,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
  ) {}

  async run({ accountName, forceRestoreSessionOnApplication }: AutoRestartCronPayload) {
    const steamAccount = await this.steamAccountsRepository.getByAccountName(accountName)
    if (!steamAccount) {
      return bad(Fail.create(EAppResults["STEAM-ACCOUNT-NOT-FOUND"], 404, { steamAccount, accountName }))
    }
    if (!steamAccount.ownerId) {
      return bad(Fail.create(EAppResults["STEAM-ACCOUNT-IS-NOT-OWNED"], 400, { steamAccount }))
    }

    const user = await this.usersDAO.getByIDShallow(steamAccount.ownerId)
    if (!user) {
      return bad(new Fail({ code: EAppResults["USER-NOT-FOUND"], payload: { user } }))
    }

    const plan = await this.planRepository.getById(user.plan.id_plan)
    if (!plan) {
      return bad(
        Fail.create(`[AutoRestarterCron]::${EAppResults["PLAN-NOT-FOUND"]}`, 404, {
          planId: user.plan.id_plan,
        })
      )
    }

    if (!forceRestoreSessionOnApplication && !plan.autoRestarter) {
      return bad(
        new Fail({
          code: EAppResults["PLAN-DOES-NOT-SUPPORT-AUTO-RELOGIN"],
          payload: {
            planName: plan.name,
            planType: plan.type,
          },
        })
      )
    }

    let sac = this.allUsersClientsStorage.getAccountClient(steamAccount.ownerId, accountName)

    /** garante um SAC truthy  */
    return await ALS_username.run(user.username, async () => {
      if (!sac || !sac.logged) {
        const [errorRestoringConnection, result] = await this.restoreAccountConnectionUseCase.execute({
          steamAccount: {
            accountName,
            password: steamAccount.credentials.password,
            autoRestart: steamAccount.autoRelogin,
            isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
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

      const state = await this.steamAccountClientStateCacheRepository.get(sac.accountName)

      const [errorRestoringSession] = await this.restoreAccountSessionUseCase.execute({
        state,
        plan,
        sac,
        username: user.username,
      })

      if (errorRestoringSession) {
        if (errorRestoringSession.payload) {
          if ("fatal" in errorRestoringSession.payload) {
            return nice(
              new AutoRestartResult("ERROR_RESTORING_SESSION", errorRestoringSession.payload.fatal, {
                error: errorRestoringSession,
              })
            )
          }
        }

        if (errorRestoringSession.code === "cluster.farmWithAccount()::UNKNOWN-CLIENT-ERROR") {
          errorRestoringSession.payload.eresult
        }

        return bad(errorRestoringSession)
      }

      return nice(new AutoRestartResult("RESTORED-SESSION", true, { success: true }))
    })
  }
}

class AutoRestartResult<const TCode = string, const TFatal = boolean, const TData = any> {
  constructor(
    public code: TCode,
    public fatal: TFatal,
    public data: TData
  ) {}
}

// new AutoRestartCron().run().then(res => {
//   const [error, data] = res
//   error?.code === ""
// })
