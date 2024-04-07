import { FarmGamesMutationResult } from "@/components/molecules/FarmGames"
import { IntentionCodes as IntentionCodes_FarmGames } from "@/components/molecules/FarmGames/types"
import { useSteamAccountStore } from "@/components/molecules/SteamAccountListItem/store/useSteamAccountStore"
import { IntentionCodes as IntentionCodes_StopFarm } from "@/components/molecules/StopFarm/types"
import { useUserSetterUpdateFarmingGames } from "@/contexts/user-actions"
import { StopFarmMutationResult } from "@/mutations"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage } from "@/util/DataOrMessage"
import { useQueryClient } from "@tanstack/react-query"
import React from "react"

type Props = {
  stopFarm: StopFarmMutationResult
  userId: string
  farmGames: FarmGamesMutationResult
}

export function useHandlers({ stopFarm, userId, farmGames }: Props) {
  const setUrgent = useSteamAccountStore(state => state.setUrgent)
  const queryClient = useQueryClient()

  const handleStopFarm = React.useCallback(
    async (
      accountName: string
    ): Promise<{
      dataOrMessage: DataOrMessage<string, IntentionCodes_StopFarm>
    }> => {
      const dataOrMessage = await stopFarm.mutateAsync({ accountName })
      const [undesired, success] = dataOrMessage
      if (undesired) {
        return Promise.resolve({
          dataOrMessage: [undesired],
        })
      }
      queryClient.invalidateQueries({ queryKey: ECacheKeys.user_session(userId) })
      // stagingFarmGames.clear()
      return Promise.resolve({
        dataOrMessage: [null, success],
      })
    },
    [stopFarm, queryClient]
  )

  const updateFarmingGames = useUserSetterUpdateFarmingGames(queryClient)

  const handleFarmGames = React.useCallback(
    async (
      accountName: string,
      gamesID: number[],
      userId: string
    ): Promise<{
      dataOrMessage: DataOrMessage<string, IntentionCodes_FarmGames>
    }> => {
      const dataOrMessage = await farmGames.mutateAsync({
        accountName,
        gamesID,
        userId,
      })
      const now = new Date()
      updateFarmingGames(accountName, gamesID)
      setUrgent(false)
      // 22: startFarm() only if farming games was 0 and staging list had more than 1 game
      return {
        dataOrMessage,
      }
    },
    [farmGames, updateFarmingGames]
  )

  return {
    handleFarmGames,
    handleStopFarm,
  }
}

export interface HHandlers {
  handleStopFarm(accountName: string): Promise<{
    dataOrMessage: DataOrMessage<string, IntentionCodes_StopFarm>
  }>
  handleFarmGames(
    accountName: string,
    gamesID: number[],
    userId: string
  ): Promise<{
    dataOrMessage: DataOrMessage<string, IntentionCodes_FarmGames>
  }>
}
