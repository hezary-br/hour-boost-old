import { useMediaQuery } from "@/components/hooks"
import { FarmGamesContext } from "@/components/molecules/FarmGames/context"
import { useSteamAccountListItem } from "@/components/molecules/SteamAccountListItem/context"
import { useSteamAccountStore } from "@/components/molecules/SteamAccountListItem/store/useSteamAccountStore"
import { useUser$, useUserId } from "@/contexts/UserContext"
import { useUserSetterSetGames } from "@/contexts/user-actions"
import { DataOrMessage } from "@/util/DataOrMessage"
import { showToastFarmGamesResult, showToastFarmingGame } from "@/util/toaster"
import { GameSession } from "core"
import React, { ChangeEvent } from "react"
import { toast } from "sonner"
import { ChooseFarmingGamesDesktop } from "./desktop"
import { DrawerChooseFarmingGamesView } from "./mobile"
import { ChooseFarmingGamesHelpers, IntentionCodes } from "./types"

export interface FarmGamesPayload {
  accountName: string
  gamesID: number[]
  userId: string
}
export type ChooseFarmingGamesDesktopProps = {
  open?: boolean
  onOpenChange?(isOpening: boolean): boolean
}

export const ChooseFarmingGames = React.memo(
  React.forwardRef<React.ElementRef<typeof ChooseFarmingGamesDesktop>, ChooseFarmingGamesDesktopProps>(
    function ChooseFarmingGamesDesktopComponent(_, ref) {
      const { isFarming, accountName, refreshGames, handlers, app, mutations } =
        local_useSteamAccountListItem.controller()
      const isLessDesktop = useMediaQuery("(max-width: 896px)")
      const stageFarmingGames_update = useSteamAccountStore(state => state.stageFarmingGames_update)
      const localStagingFarm_list = useSteamAccountStore(state => state.localStagingFarm_list)
      const localStagingFarm_set = useSteamAccountStore(state => state.localStagingFarm_set)
      const closeModal_desktop = useSteamAccountStore(state => state.closeModal_desktop)
      const filterInputLocalStaging = useSteamAccountStore(state => state.filterInputLocalStaging)
      const stageFarmingGames_hasGamesOnTheList = useSteamAccountStore(
        state => state.stageFarmingGames_hasGamesOnTheList
      )
      const urgent = useSteamAccountStore(state => state.urgent)
      const stageFarmingGames_handleAddGameToFarmStaging = useSteamAccountStore(
        state => state.handleAddGameToFarmStaging
      )
      const userId = useUserId()
      const handleActionButton = React.useCallback(async () => {
        const [errorUpdatingStagingGames] = await mutations.updateStagingGames.mutateAsync({
          accountName: app.accountName,
          newGameList: localStagingFarm_list,
        })
        if (errorUpdatingStagingGames) return
        stageFarmingGames_update()

        const getFarmGamesPromise = () => {
          return handlers.handleFarmGames(accountName, localStagingFarm_list, userId)
        }
        const args = [app.games, localStagingFarm_list, () => closeModal_desktop()] as const

        if (urgent) {
          if (!stageFarmingGames_hasGamesOnTheList()) {
            toast.warning("Adicione pelo menos 1 jogo para começar o farm.")
            return
          }
          const [error] = await startFarmAbstraction(getFarmGamesPromise(), ...args)
          if (error) return
          return
        }
        if (!isFarming() || !stageFarmingGames_hasGamesOnTheList()) {
          toast.success("Jogos salvos.")
          closeModal_desktop()
          return
        }
        const [error] = await startFarmAbstraction(getFarmGamesPromise(), ...args)
        if (error) return
        return
      }, [
        handlers.handleFarmGames,
        app.games,
        localStagingFarm_list,
        closeModal_desktop,
        urgent,
        stageFarmingGames_hasGamesOnTheList(),
        isFarming(),
      ])

      function handleStopFarm() {
        // stagingFarmGames.clear()
      }

      const setGames = useUserSetterSetGames()
      async function handleRefreshGames() {
        const { games } = await refreshGames.mutateAsync({ accountName: accountName })
        setGames(accountName, games)
      }

      const handleAddGameToFarmStaging = React.useCallback(
        (gameId: number) => {
          stageFarmingGames_handleAddGameToFarmStaging(gameId, error => {
            toast.info(error.message)
          })
        },
        [stageFarmingGames_handleAddGameToFarmStaging]
      )

      const clearLocalStagingFarmList = React.useCallback(() => {
        localStagingFarm_set([])
      }, [])

      const gameList = React.useMemo(() => {
        if (!app.games) return null
        if (filterInputLocalStaging.length === 0) return app.games
        return app.games.filter(game =>
          game.name.toLowerCase().includes(filterInputLocalStaging.toLowerCase())
        )
      }, [filterInputLocalStaging, app.games])

      const actionSavingState =
        mutations.farmGames.isPending ||
        mutations.stopFarm.isPending ||
        mutations.updateStagingGames.isPending

      const setModalOpen_desktop = useSteamAccountStore(state => state.setModalOpen_desktop)
      const filterInputLocalStaging_set = useSteamAccountStore(state => state.filterInputLocalStaging_set)
      const setUrgent = useSteamAccountStore(state => state.setUrgent)

      const maxGamesAllowed = useUser$(u => u.plan.maxGamesAllowed)
      const stageFarmingGames_list = useSteamAccountStore(state => state.stageFarmingGames_list)

      const gamesStaging = React.useMemo(() => {
        return `${stageFarmingGames_list.length}/${maxGamesAllowed}`
      }, [stageFarmingGames_list, maxGamesAllowed])

      const localStagingSelectedGames = React.useMemo(() => {
        return `${localStagingFarm_list.length}/${maxGamesAllowed}`
      }, [localStagingFarm_list, maxGamesAllowed])

      const onOpenChange = React.useCallback(
        (isOpen: boolean) => {
          if (!isOpen) {
            setUrgent(false)
            filterInputLocalStaging_set("")
          }
          setModalOpen_desktop(isOpen)
        },
        [setUrgent, filterInputLocalStaging_set, setModalOpen_desktop]
      )

      const handleFilterInput_onChange = React.useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
          filterInputLocalStaging_set(e.target.value)
        },
        [filterInputLocalStaging_set]
      )

      const helpers: ChooseFarmingGamesHelpers = {
        handleRefreshGames,
        handleStopFarm,
        handleActionButton,
        handleAddGameToFarmStaging,
        clearLocalStagingFarmList,
        actionSavingState,
        gameList,
        onOpenChange,
        gamesStaging,
        handleFilterInput: {
          onChange: handleFilterInput_onChange,
          value: filterInputLocalStaging,
        },
        localStagingSelectedGames,
      }

      return (
        <FarmGamesContext.Provider
          value={{
            helpers: helpers,
          }}
        >
          {isLessDesktop && <DrawerChooseFarmingGamesView />}
          {!isLessDesktop && <ChooseFarmingGamesDesktop />}
        </FarmGamesContext.Provider>
      )
    }
  )
)

ChooseFarmingGames.displayName = "ChooseFarmingGamesDesktop"

export const local_useSteamAccountListItem = {
  controller() {
    return useSteamAccountListItem(state => ({
      refreshGames: state.mutations.refreshGames,
      accountName: state.app.accountName,
      games: state.app.games,
      farmGames: state.mutations.farmGames,
      stopFarm: state.mutations.stopFarm,
      ...state,
    }))
  },
  farmGames() {
    return useSteamAccountListItem(state => ({
      accountName: state.app.accountName,
      games: state.app.games,
      farmGames: state.mutations.farmGames,
      stopFarm: state.mutations.stopFarm,
      refreshGames: state.mutations.refreshGames,
      isFarming: () => state.isFarming(),
      handleFarmGames: state.handlers.handleFarmGames,
    }))
  },
}

async function startFarmAbstraction(
  promise: Promise<{
    dataOrMessage: DataOrMessage<string, IntentionCodes>
  }>,
  games: GameSession[] | null,
  stageFarmingGamesList: number[],
  closeModal: () => void
): Promise<[error: boolean]> {
  if (!games) {
    toast.error("Nenhum jogo foi encontrado na sua conta, atualize seus jogos ou a página.")
    return [true]
  }
  const { dataOrMessage } = await promise
  const [undesired] = dataOrMessage
  if (undesired) {
    showToastFarmGamesResult(undesired)
    return [true]
  }
  showToastFarmingGame(stageFarmingGamesList, games)
  closeModal()
  return [false]
}
