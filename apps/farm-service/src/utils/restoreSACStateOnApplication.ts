import { type CacheState, Fail } from "core"
import type { UserSACsFarmingCluster } from "~/application/services"
import type { SteamAccountClient } from "~/application/services/steam"
import { EAppResults, type SACGenericError } from "~/application/use-cases"
import { env } from "~/env"
import { bad, nice } from "~/utils/helpers"

export function restoreSACStateOnApplication(userCluster: UserSACsFarmingCluster) {
  return async (sac: SteamAccountClient, state: CacheState) => {
    const isAccountFarming = userCluster.isAccountFarmingOnService(sac.accountName)
    if (!userCluster.hasSteamAccountClient(sac.accountName) && !isAccountFarming) {
      const [errorAddingSac] = userCluster.addSAC(sac)

      if (errorAddingSac?.code === "TRIED_TO_ADD::ALREADY_EXISTS") {
      }
    }

    sac.restoreCacheHollowSession({
      accountName: state.accountName,
      planId: state.planId,
      username: state.username,
    })

    sac.updateStagingGames(state.gamesStaging)
    sac.setStatus(state.status === "iddle" ? "online" : state.status)

    if (state.isFarming()) {
      const [errorFarmWithAccount] = await userCluster.farmWithAccount({
        accountName: state.accountName,
        gamesId: state.gamesPlaying,
        planId: state.planId,
        session: state.farmStartedAt
          ? {
              type: "CONTINUE-FROM-PREVIOUS",
              farmStartedAt: new Date(state.farmStartedAt),
            }
          : {
              type: "NEW",
            },
      })
      if (errorFarmWithAccount) return bad(errorFarmWithAccount)
    }

    const delay: number = env.NODE_ENV === "PRODUCTION" ? 1000 : 0

    const error = await Promise.race([
      new Promise<SACGenericError>(res => sac.client.once("error", res)),
      new Promise<false>(res => setTimeout(() => res(false), delay)),
    ])

    if (error) {
      const fail = new Fail({
        code: EAppResults["UNKNOWN-CLIENT-ERROR"],
        httpStatus: 400,
        payload: error,
      })
      return bad(fail)
    }

    return nice()
  }
}
