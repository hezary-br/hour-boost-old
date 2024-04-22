import { useMediaQuery } from "@/components/hooks"
import { useChangeAccountStatus } from "@/components/molecules/ChangeAccountStatus"
import { IntentionCodes as IntentionCodes_ChangeStatus } from "@/components/molecules/ChangeAccountStatus/types"
import { useFarmGamesMutation } from "@/components/molecules/FarmGames"
import { useSteamAccountStore } from "@/components/molecules/SteamAccountListItem/store/useSteamAccountStore"
import { useToggleAutoReloginMutation } from "@/components/molecules/ToggleAutoRelogin/mutation"
import { useUpdateStagingGames } from "@/components/molecules/UpdateStagingGames"
import { useUser$, useUserId } from "@/contexts/UserContext"
import { api } from "@/lib/axios"
import { useRefreshGamesMutation, useStopFarmMutation } from "@/mutations"
import { DataOrMessage } from "@/util/DataOrMessage"
import { planIsUsage } from "@/util/thisPlanIsUsage"
import { useAuth } from "@clerk/clerk-react"
import { AppAccountStatus, formatTimeSinceShort } from "core"
import React, { createContext, useContext, useMemo, useState } from "react"
import { toast } from "sonner"
import { ISteamAccountListItemContext, SteamAccountListItemContext } from "./context"
import { SteamAccountListItemViewDesktop } from "./desktop"
import { useHandlers } from "./hooks/useHandlers"
import { SteamAccountListItemViewMobile } from "./mobile"
import { SteamAccountAppProps, SteamAccountListItemViewProps, SteamAccountStatusProps } from "./types"

export function SteamAccountList({
  app,
  status: statusProps,
  displayUpdateInServerMessage,
}: {
  status: SteamAccountStatusProps
  app: SteamAccountAppProps
  displayUpdateInServerMessage: boolean
}) {
  const [status, setStatusState] = useState<AppAccountStatus>(app.status)
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }
  const hasUsagePlanLeft = useUser$(user =>
    planIsUsage(user.plan) ? user.plan.farmUsedTime < user.plan.maxUsageTime : true
  )

  const refreshGames = useRefreshGamesMutation(getAPI)
  const stopFarm = useStopFarmMutation(getAPI)
  const farmGames = useFarmGamesMutation(getAPI)
  const changeAccountStatus = useChangeAccountStatus(getAPI)
  const updateStagingGames = useUpdateStagingGames(getAPI)

  const isLessDesktop = useMediaQuery("(max-width: 896px)")
  const userId = useUserId()

  const stageFarmingGames_list = useSteamAccountStore(state => state.stageFarmingGames_list)
  const stageFarmingGames_hasGamesOnTheList = useSteamAccountStore(
    state => state.stageFarmingGames_hasGamesOnTheList
  )
  const setUrgent = useSteamAccountStore(state => state.setUrgent)
  const openModal_desktop = useSteamAccountStore(state => state.openModal_desktop)
  const toggleAutoRelogin = useSteamAccountStore(state => state.toggleAutoRelogin)

  const handlers = useHandlers({
    farmGames,
    stopFarm,
    userId,
    games: app.games,
  })

  const isFarming = React.useCallback(() => {
    return app.farmingGames.length > 0
  }, [app.farmingGames.length])

  /**
   * Toggle Auto Relogin
   */
  const toggleAutoReloginMutation = useToggleAutoReloginMutation(app.accountName, getAPI)

  const handleToggleAutoRelogin = React.useCallback(async () => {
    toggleAutoRelogin()
    const [undesired, result] = await toggleAutoReloginMutation.mutateAsync({
      accountName: app.accountName,
      userId,
    })
    if (undesired) return
    return result
  }, [toggleAutoReloginMutation, app.accountName])

  /**
   * Farm Games
   */
  // USE CALLBACK?
  const handleClickFarmButton = () => {
    if (isFarming()) {
      handlers.handleStopFarm(app.accountName)
      toast.info("Farm pausado")
      return
    }
    if (!stageFarmingGames_hasGamesOnTheList()) {
      setUrgent(true)
      openModal_desktop()

      toast.info("Escolha alguns jogos primeiro.")
      return
    }
    if (!app.games) {
      toast.error("Nenhum jogo foi encontrado na sua conta, atualize seus jogos ou a página.")
      return
    }
    handlers.handleFarmGames(app.accountName, stageFarmingGames_list, userId)
  }

  const handleChangeStatus = React.useCallback(
    async (newStatus: AppAccountStatus) => {
      const [error, result] = await changeAccountStatus.mutateAsync({
        accountName: app.accountName,
        status: newStatus,
      })
      if (error) return [error] as DataOrMessage<string, IntentionCodes_ChangeStatus>
      setStatusState(newStatus)
      return [null, result] as DataOrMessage<string, IntentionCodes_ChangeStatus>
    },
    [changeAccountStatus, app.accountName]
  )

  const value: ISteamAccountListItemContext = useMemo(
    () => ({
      handleChangeStatus,
      handleToggleAutoRelogin,
      ...statusProps,
      mutations: {
        farmGames,
        refreshGames,
        stopFarm,
        changeAccountStatus,
        toggleAutoRelogin: toggleAutoReloginMutation,
        updateStagingGames,
      },
      isFarming,
      hasUsagePlanLeft,
      handlers,
      app,
      status,
      farmingTime: 0,
    }),
    [
      statusProps,
      farmGames,
      refreshGames,
      stopFarm,
      changeAccountStatus,
      app.farmingGames.length,
      handlers,
      app,
    ]
  )

  const actionText = getActionText({
    farmGamesPending: farmGames.isPending,
    stopFarmPending: stopFarm.isPending,
    isFarming: isFarming(),
  })

  const props: SteamAccountListItemViewProps = {
    handleClickFarmButton,
    actionText,
    displayUpdateInServerMessage,
  }

  return (
    <SteamAccountIdContext.Provider value={app.id_steamAccount}>
      <SteamAccountListItemContext.Provider value={value}>
        {isLessDesktop && <SteamAccountListItemViewMobile {...props} />}
        {!isLessDesktop && <SteamAccountListItemViewDesktop {...props} />}
      </SteamAccountListItemContext.Provider>
    </SteamAccountIdContext.Provider>
  )
}

const SteamAccountIdContext = createContext("")

export function useSteamAccountId() {
  return useContext(SteamAccountIdContext)
}

export function getActionText({
  farmGamesPending,
  stopFarmPending,
  isFarming,
}: {
  farmGamesPending: boolean
  stopFarmPending: boolean
  isFarming: boolean
}): JSX.Element {
  const Text = React.memo<React.PropsWithChildren>(props => (
    <span className="whitespace-nowrap">{props.children}</span>
  ))

  if (farmGamesPending) return <Text>Começando farm...</Text>
  if (stopFarmPending) return <Text>Parando farm...</Text>
  if (isFarming) return <Text>Parar farm</Text>
  return <Text>Começar farm</Text>
}

export function getFarmedTimeSince(timeInSeconds: number) {
  const timeSince = formatTimeSinceShort(timeInSeconds * 1000)
  const [timeNumber, category, ...secondaryRest] = timeSince.split(" ")

  const highlightTime = [timeNumber, category].join(" ")
  const secondaryTime = secondaryRest.join(" ")

  return {
    highlightTime,
    secondaryTime,
  }
}
