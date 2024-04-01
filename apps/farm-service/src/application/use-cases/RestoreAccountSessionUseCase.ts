import {
  CacheState,
  type CacheStateDTO,
  type DataOrFail,
  Fail,
  type Mutable,
  type PlanInfinity,
  type PlanUsage,
} from "core"
import type { UsersSACsFarmingClusterStorage } from "~/application/services"
import type { SteamAccountClient } from "~/application/services/steam"
import { handleSteamClientError } from "~/application/use-cases"
import type { Publisher } from "~/infra/queue"
import type { FailGeneric } from "~/types/EventsApp.types"
import { type Pretify, bad, nice } from "~/utils/helpers"
import { restoreSACStateOnApplication } from "~/utils/restoreSACStateOnApplication"

type Payload = {
  state: CacheState | null
  plan: PlanInfinity | PlanUsage
  sac: SteamAccountClient
  username: string
}

interface IRestoreAccountSessionUseCase {
  execute(payload: Payload): Promise<DataOrFail<FailGeneric, any>>
}

const moduleName = "[RestoreAccountSessionUseCase]"

/**
 * Já possui SAC ativo, logado ou não, e quer
 * atualizar/restaurar sessão (status, jogos farmando...)
 */
export class RestoreAccountSessionUseCase implements IRestoreAccountSessionUseCase {
  constructor(
    private readonly usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage,
    private readonly publisher: Publisher
  ) {}

  async execute({ state, plan, sac, username }: Payload) {
    const [errorRestoringOnApplication] = await restoreSACSessionOnApplication({
      plan,
      sac,
      state: state?.toDTO() ?? null,
      username,
      usersClusterStorage: this.usersSACsFarmingClusterStorage,
    })

    if (!errorRestoringOnApplication) {
      return nice({ code: EAppResults["SESSION-RESTORED"] })
    }

    if (errorRestoringOnApplication) {
      if (errorRestoringOnApplication.code === "UNKNOWN-CLIENT-ERROR") {
        const error = handleSteamClientError(errorRestoringOnApplication.payload)
        if (error) {
          return bad(
            new Fail({
              code: error.code,
              payload: {
                eresult: error.payload.eresult,
              },
            })
          )
        }
      }
      if (errorRestoringOnApplication.code === "[FarmUsageService]:PLAN-MAX-USAGE-EXCEEDED") {
        return bad(errorRestoringOnApplication)
      }
      if (errorRestoringOnApplication.code === "cluster.farmWithAccount()::UNKNOWN-CLIENT-ERROR") {
        const fail = new Fail({
          code: errorRestoringOnApplication.code,
          httpStatus: 400,
          payload: errorRestoringOnApplication.payload,
        })
        if (fail.code === "cluster.farmWithAccount()::UNKNOWN-CLIENT-ERROR") {
          fail.payload
        }
        return bad(fail)
      }
      return bad(
        new Fail({
          code: `${moduleName}::${errorRestoringOnApplication.code ?? "UNKNOWN_ERROR"}`,
          payload: errorRestoringOnApplication,
        })
      )
    }

    return bad(new Fail({ code: EAppResults["UNKNOWN-APPLICATION-ERROR"] }))
  }
}

type Props = {
  sac: SteamAccountClient
  usersClusterStorage: UsersSACsFarmingClusterStorage
  plan: PlanUsage | PlanInfinity
  username: string
  state: CacheStateDTO | null
}

export async function restoreSACSessionOnApplication({
  plan,
  sac,
  state,
  username,
  usersClusterStorage,
}: Props) {
  const userCluster = usersClusterStorage.getOrAdd(username, plan)

  if (state) {
    const restore = restoreSACStateOnApplication(userCluster)
    const [error] = await restore(sac, CacheState.restoreFromDTO(state))
    if (error) return bad(error)
  }

  return nice()
}

restoreSACSessionOnApplication satisfies (...args: any[]) => Promise<DataOrFail<Fail>>

// restoreSACSessionOnApplication().then(res => {
//   const [error] = res

//   if(error?.code === "[RestoreAccountSessionUseCase]::ACCOUNT-ALREADY-FARMING") return
//   if(error?.code === "[RestoreAccountSessionUseCase]::SAC-NOT-FOUND") return
// })

// new RestoreAccountSessionUseCase().execute().then(res => {
//   const [error, result] = res
// })

const EAppResultsRaw = {
  "SESSION-RESTORED": "SESSION-RESTORED",
  "UNKNOWN-CLIENT-ERROR": "UNKNOWN-CLIENT-ERROR",
  "CONTINUE-FROM-PREVIOUS": "CONTINUE-FROM-PREVIOUS",
  "SAC-NOT-FOUND": "SAC-NOT-FOUND",
  "PLAN-NOT-FOUND": "PLAN-NOT-FOUND",
  "ACCOUNT-ALREADY-FARMING": "ACCOUNT-ALREADY-FARMING",
  "PLAN-NOT-FOUND-VIA-USER-ID": "PLAN-NOT-FOUND-VIA-USER-ID",
  "USERNAME-NOT-FOUND-VIA-USER-ID": "USERNAME-NOT-FOUND-VIA-USER-ID",
  "USER-NOT-FOUND": "USER-NOT-FOUND",
  "CLUSTER-NOT-FOUND": "CLUSTER-NOT-FOUND",
  "UNKNOWN-ERROR": "UNKNOWN-ERROR",
  "UNKNOWN-APPLICATION-ERROR": "UNKNOWN-APPLICATION-ERROR",
  "PLAN-DOES-NOT-SUPPORT-AUTO-RELOGIN": "PLAN-DOES-NOT-SUPPORT-AUTO-RELOGIN",
  "STEAM-ACCOUNT-IS-NOT-OWNED": "STEAM-ACCOUNT-IS-NOT-OWNED",
  "STEAM-ACCOUNT-NOT-FOUND": "STEAM-ACCOUNT-NOT-FOUND",
  "PLAN-MAX-USAGE-EXCEEDED": "PLAN-MAX-USAGE-EXCEEDED",
  "USER-STORAGE-NOT-FOUND": "USER-STORAGE-NOT-FOUND",
  "SAC-NOT-LOGGED": "SAC-NOT-LOGGED",
  "LIST::COULD-NOT-RESET-FARM": "LIST::COULD-NOT-RESET-FARM"
} as const

export const EAppResults = EAppResultsRaw as Pretify<Mutable<typeof EAppResultsRaw>>
