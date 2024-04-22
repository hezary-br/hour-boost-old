import { ChangeAccountStatusPayload } from "@/components/molecules/ChangeAccountStatus/controller"
import { IntentionCodes as IntentionCodes_ChangeStatus } from "@/components/molecules/ChangeAccountStatus/types"
import { FarmGamesPayload } from "@/components/molecules/FarmGames/controller"
import { HHandlers } from "@/components/molecules/SteamAccountListItem/hooks/useHandlers"
import { StopFarmPayload } from "@/components/molecules/StopFarm/controller"
import { IntentionCodes as IntentionCodes_StopFarm } from "@/components/molecules/StopFarm/types"
import { ToggleAutoReloginPayload } from "@/components/molecules/ToggleAutoRelogin/controller"
import { ToggleAutoReloginMutationResult } from "@/components/molecules/ToggleAutoRelogin/mutation"
import { IntentionCodes as IntentionCodes_ToggleAutoRelogin } from "@/components/molecules/ToggleAutoRelogin/types"
import { UpdateStagingGamesMutationResult } from "@/components/molecules/UpdateStagingGames"
import { SuccessResponse as RefreshGames_SuccessResponse } from "@/mutations"
import { DataOrMessage } from "@/util/DataOrMessage"
import { DefaultError, UseMutationResult } from "@tanstack/react-query"
import { AppAccountStatus } from "core"
import React from "react"
import { SteamAccountAppProps, SteamAccountStatusLiveProps, SteamAccountStatusProps } from "./types"

export interface ISteamAccountListItemContext extends SteamAccountStatusProps, SteamAccountStatusLiveProps {
  app: SteamAccountAppProps
  handleChangeStatus(newStatus: AppAccountStatus): Promise<DataOrMessage<string, IntentionCodes_ChangeStatus>>
  handleToggleAutoRelogin(): Promise<string | undefined>
  isFarming(): boolean
  hasUsagePlanLeft: boolean
  status: AppAccountStatus
  mutations: {
    stopFarm: MutationStopFarm
    refreshGames: MutationRefreshGames
    farmGames: MutationFarmGames
    changeAccountStatus: MutationChangeAccountStatus
    toggleAutoRelogin: ToggleAutoReloginMutationResult
    updateStagingGames: UpdateStagingGamesMutationResult
    // toggleAutoRelogin: MutationToggleAutoRelogin
  }
  handlers: HHandlers
}

export const SteamAccountListItemContext = React.createContext({} as ISteamAccountListItemContext)

export function useSteamAccountListItem<R>(): ISteamAccountListItemContext
export function useSteamAccountListItem<R>(selector: (context: ISteamAccountListItemContext) => R): R
export function useSteamAccountListItem(selector?: (...args: any[]) => any) {
  const context = React.useContext(SteamAccountListItemContext)
  return selector ? selector(context) : context
}

export type MutationStopFarm = UseMutationResult<
  DataOrMessage<string, IntentionCodes_StopFarm>,
  Error,
  StopFarmPayload,
  unknown
>

export type MutationRefreshGames = UseMutationResult<
  DataOrMessage<RefreshGames_SuccessResponse, "UNKNOWN">,
  unknown,
  {
    accountName: string
  },
  unknown
>

export type MutationFarmGames = UseMutationResult<void, Error, FarmGamesPayload, unknown>

export type MutationChangeAccountStatus = UseMutationResult<
  DataOrMessage<string, IntentionCodes_ChangeStatus>,
  Error,
  ChangeAccountStatusPayload,
  unknown
>

export type MutationToggleAutoRelogin = UseMutationResult<
  DataOrMessage<string, IntentionCodes_ToggleAutoRelogin>,
  DefaultError,
  ToggleAutoReloginPayload,
  unknown
>
