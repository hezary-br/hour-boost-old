import {
  type CacheState,
  Fail,
  PlanInfinity,
  PlanUsage,
  type SteamAccountClientStateCacheRepository,
} from "core"
import type {
  AllUsersClientsStorage,
  UserSACsFarmingCluster,
  UsersSACsFarmingClusterStorage,
} from "~/application/services"
import type { SteamAccountClient } from "~/application/services/steam"
import { StopFarmDomain } from "~/features/stop-farm/domain"
import { getSACOn_AllUsersClientsStorage_ByUserId } from "~/utils/getSAC"
import { bad, nice } from "~/utils/helpers"
import { restoreSACStateOnApplication } from "~/utils/restoreSACStateOnApplication"

type MakeResetFarmProps = {
  allUsersClientsStorage: AllUsersClientsStorage
  usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage
  steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
}

type MakeResetFarmEntitiesProps = {
  allUsersClientsStorage: AllUsersClientsStorage
  usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage
}

type ResetFarmProps = {
  accountName: string
  username: string
  userId: string
  isFinalizingSession: boolean
  plan: PlanUsage | PlanInfinity | null
}

type ResetFarmEntitiesProps = {
  accountName: string
  username: string
  userId: string
  isFinalizingSession: boolean
  state: CacheState
  plan: PlanUsage | PlanInfinity | null
}

export function makeResetFarm({
  allUsersClientsStorage,
  steamAccountClientStateCacheRepository,
  usersSACsFarmingClusterStorage,
}: MakeResetFarmProps) {
  return async ({ accountName, userId, username, isFinalizingSession, plan }: ResetFarmProps) => {
    const state = await steamAccountClientStateCacheRepository.get(accountName)
    if (!state) return bad(Fail.create("NO_CACHE_STATE_FOUND", 404))

    const [errorGettingSAC, sac] = getSACOn_AllUsersClientsStorage_ByUserId(
      userId,
      allUsersClientsStorage
    )(accountName)
    if (errorGettingSAC) return bad(errorGettingSAC)

    const [errorFindingCluster, userCluster] = usersSACsFarmingClusterStorage.get(username)
    if (errorFindingCluster) return bad(errorFindingCluster)

    const stopFarmDomain = new StopFarmDomain(usersSACsFarmingClusterStorage)
    const result = await resetFarm(stopFarmDomain)({
      accountName,
      sac,
      state,
      userCluster,
      username,
      isFinalizingSession,
      plan,
    })
    return result
  }
}

export function makeResetFarmEntities({
  allUsersClientsStorage,
  usersSACsFarmingClusterStorage,
}: MakeResetFarmEntitiesProps) {
  return async ({
    accountName,
    state,
    userId,
    username,
    isFinalizingSession,
    plan,
  }: ResetFarmEntitiesProps) => {
    const [errorGettingSAC, sac] = getSACOn_AllUsersClientsStorage_ByUserId(
      userId,
      allUsersClientsStorage
    )(accountName)
    if (errorGettingSAC) return bad(errorGettingSAC)

    const [errorFindingCluster, userCluster] = usersSACsFarmingClusterStorage.get(username)
    if (errorFindingCluster) return bad(errorFindingCluster)

    const stopFarmDomain = new StopFarmDomain(usersSACsFarmingClusterStorage)
    return resetFarm(stopFarmDomain)({
      accountName,
      sac,
      state,
      userCluster,
      username,
      isFinalizingSession,
      plan,
    })
  }
}

type ResetFarmProps2 = {
  sac: SteamAccountClient
  userCluster: UserSACsFarmingCluster
  state: CacheState
  accountName: string
  username: string
  plan: PlanUsage | PlanInfinity | null
  isFinalizingSession: boolean
}

export function resetFarm(stopFarmDomain: StopFarmDomain) {
  return async ({
    state,
    userCluster,
    sac,
    accountName,
    plan,
    username,
    isFinalizingSession,
  }: ResetFarmProps2) => {
    const [error, data] = stopFarmDomain.execute({
      accountName,
      username,
      isFinalizingSession,
    })
    if (error) {
      switch (error.code) {
        case "PAUSE-FARM-ON-ACCOUNT-NOT-FOUND":
        case "TRIED-TO-STOP-FARM-ON-NON-FARMING-ACCOUNT":
        case "DO-NOT-HAVE-ACCOUNTS-FARMING":
          break
        case "[Users-Cluster-Storage]:CLUSTER-NOT-FOUND":
          return bad(error)
        default:
          error satisfies never
      }
    }

    const [errorRestoringSACState] = await restoreSACStateOnApplication(userCluster, plan)(sac, state)
    if (errorRestoringSACState) return bad(errorRestoringSACState)
    return nice(data)
  }
}

export type ResetFarm = ReturnType<typeof makeResetFarm>
export type ResetFarmEntities = ReturnType<typeof makeResetFarmEntities>
