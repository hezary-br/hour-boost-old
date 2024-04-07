import { getUserActionsMakerWrapper } from "@/contexts/helpers"
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { GameSession, UserSession } from "core"
import { produce } from "immer"

type Action = (user: UserSession | undefined) => void
type GenericActionHook<TArgs extends any[]> = (...args: TArgs) => Action

function createActionHook<const TArgs extends any[]>(action: GenericActionHook<TArgs>) {
  return (queryClient?: QueryClient) => {
    const _queryClient = queryClient || useQueryClient()
    const setUser = getUserActionsMakerWrapper(_queryClient)
    return (...args: TArgs) => setUser(user => produce(user, action(...args)))
  }
}

const toggleAutoRestart = (accountName: string): Action => {
  return user => {
    const steamAccount = user!.steamAccounts.find(sa => sa.accountName === accountName)!
    steamAccount.autoRelogin = !steamAccount.autoRelogin
  }
}

const setGames = (accountName: string, games: GameSession[]): Action => {
  return user => {
    const steamAccount = user!.steamAccounts.find(sa => sa.accountName === accountName)!
    steamAccount.games = games
  }
}

const removeSteamAccount = (accountName: string): Action => {
  return user => {
    const steamAccountIndex = user!.steamAccounts.findIndex(sa => sa.accountName === accountName)
    user!.steamAccounts.splice(steamAccountIndex, 1)
  }
}

const updateFarmingGames = (accountName: string, gameIdList: number[]): Action => {
  return user => {
    const steamAccount = user!.steamAccounts.find(sa => sa.accountName === accountName)!
    // const isStartingFarm = checkIsStartingFarm(steamAccount.farmingGames, gameIdList)
    if (steamAccount.farmingGames.length === 0) {
      steamAccount.farmStartedAt = new Date().toISOString()
    }
    if (gameIdList.length === 0) {
      steamAccount.farmStartedAt = null
    }
    steamAccount.farmingGames = gameIdList
  }
}

const stopFarm = (accountName: string): Action => {
  return user => {
    const steamAccount = user!.steamAccounts.find(sa => sa.accountName === accountName)!
    steamAccount.farmingGames = []
    steamAccount.farmStartedAt = null
  }
}

const updateFarm = (accountName: string, newGames: number[]): Action => {
  return user => {
    const steamAccount = user!.steamAccounts.find(sa => sa.accountName === accountName)!
    steamAccount.farmingGames = newGames
  }
}

export const useUserSetterToggleAutoRestart = createActionHook(toggleAutoRestart)
export const useUserSetterSetGames = createActionHook(setGames)
export const useUserSetterUpdateFarmingGames = createActionHook(updateFarmingGames)
export const useUserSetterStopFarm = createActionHook(stopFarm)
export const useUserSetterUpdateFarm = createActionHook(updateFarm)
export const useUserSetterRemoveSteamAccount = createActionHook(removeSteamAccount)
