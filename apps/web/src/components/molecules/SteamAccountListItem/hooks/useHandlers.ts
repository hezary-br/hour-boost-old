import { FarmGamesMutationResult } from "@/components/molecules/FarmGames"
import { FarmGamesPayload } from "@/components/molecules/FarmGames/controller"
import { useSteamAccountStore } from "@/components/molecules/SteamAccountListItem/store/useSteamAccountStore"
import { StopFarmMutationResult } from "@/mutations"
import { showToastFarmingGame } from "@/util/toaster"
import { useQueryClient } from "@tanstack/react-query"
import { GameSession } from "core"
import React from "react"

type Props = {
  stopFarm: StopFarmMutationResult
  userId: string
  farmGames: FarmGamesMutationResult
  games: GameSession[] | null
}

export function useHandlers({ games, stopFarm, userId, farmGames }: Props) {
  const setUrgent = useSteamAccountStore(state => state.setUrgent)
  const queryClient = useQueryClient()

  const handleStopFarm = React.useCallback(
    async (accountName: string) => {
      stopFarm.mutate({ accountName })
    },
    [stopFarm, queryClient]
  )

  const list = useSteamAccountStore(state => state.stageFarmingGames_list)

  const handleFarmGames = React.useCallback(
    (accountName: string, gamesID: number[], userId: string) => {
      const input: FarmGamesPayload = {
        accountName,
        gamesID,
        userId,
      }
      farmGames.mutate(input, {
        onSuccess() {
          if (games) showToastFarmingGame(list, games)
          setUrgent(false)
        },
      })
    },
    [farmGames]
  )

  return {
    handleFarmGames,
    handleStopFarm,
  }
}

export interface HHandlers {
  handleStopFarm(accountName: string): void
  handleFarmGames(accountName: string, gamesID: number[], userId: string): void
}
