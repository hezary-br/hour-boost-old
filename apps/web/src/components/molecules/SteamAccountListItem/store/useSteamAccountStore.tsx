import { AppError } from "@/util/AppError"
import React, { PropsWithChildren } from "react"
import { StoreApi, createStore, useStore } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export interface StoreSteamAccountItemStateAPI {
  localStagingFarm_list: number[]
  stageFarmingGames_list: number[]
  urgent: boolean
  modalOpen_desktop: boolean
  autoRelogin: boolean
  filterInputLocalStaging: string
}

interface StoreSteamAccountItemMethods {
  localStagingFarm_clear(): void
  localStagingFarm_set(newList: number[]): void
  localStagingFarm_hasGame(gameId: number): boolean
  handleAddGameToFarmStaging(gameId: number, onError: (message: AppError) => void): void
  stageFarmingGames_update(): void
  stageFarmingGames_hasGamesOnTheList(): boolean
  setUrgent(newValue: boolean): void
  setModalOpen_desktop(isOpening: boolean): void
  closeModal_desktop(): void
  openModal_desktop(): void
  toggleAutoRelogin(): void
  filterInputLocalStaging_set(newValue: string): void
}

interface StoreSteamAccountItem extends StoreSteamAccountItemMethods, StoreSteamAccountItemStateAPI {}

export const ContextSteamAccountItemStore = React.createContext<StoreApi<StoreSteamAccountItem> | null>(null)

type StoreSteamAccountApplicationContext = {
  planMaxGamesAllowed: number
}

const createStoreSteamAccountItem = (
  initialState: StoreSteamAccountItemStateAPI,
  contextInfo: StoreSteamAccountApplicationContext
) => {
  return createStore<StoreSteamAccountItem, [["zustand/devtools", never], ["zustand/immer", never]]>(
    devtools(
      immer((set, get) => ({
        ...initialState,
        localStagingFarm_set(newList) {
          set(state => void (state.localStagingFarm_list = newList))
        },
        stageFarmingGames_update() {
          set(state => ({
            ...state,
            stageFarmingGames_list: state.localStagingFarm_list,
          }))
        },
        setUrgent(newValue) {
          set(state => ({
            ...state,
            urgent: newValue,
          }))
        },
        localStagingFarm_hasGame(gameId) {
          return get().localStagingFarm_list.includes(gameId)
        },
        localStagingFarm_clear() {
          set(state => ({ ...state, stageFarmingGames_list: [], localStagingFarm_list: [] }))
        },
        stageFarmingGames_hasGamesOnTheList() {
          return get().stageFarmingGames_list.length > 0
        },
        handleAddGameToFarmStaging(gameId, onError) {
          set(state => {
            const isAdding = !state.localStagingFarm_list.includes(gameId)
            if (!isAdding) {
              state.localStagingFarm_list = state.localStagingFarm_list.filter(gid => gid !== gameId)
              return
            }
            if (state.localStagingFarm_list.length >= contextInfo.planMaxGamesAllowed) {
              return void onError(
                new AppError(
                  `Seu plano permite apenas o farm de ${contextInfo.planMaxGamesAllowed} jogos ao mesmo tempo.`
                )
              )
            }
            state.localStagingFarm_list.push(gameId)
          })
        },
        closeModal_desktop: () => set(state => void (state.modalOpen_desktop = false)),
        openModal_desktop: () => set(state => void (state.modalOpen_desktop = true)),
        setModalOpen_desktop: isOpening => set(state => void (state.modalOpen_desktop = isOpening)),
        toggleAutoRelogin: () => set(state => void (state.autoRelogin = !state.autoRelogin)),
        autoRelogin: initialState.autoRelogin,
        filterInputLocalStaging_set: newValue =>
          set(state => void (state.filterInputLocalStaging = newValue)),
        filterInputLocalStaging: "",
      }))
    )
  )
}

export function ZustandSteamAccountStoreProvider(
  props: PropsWithChildren & {
    initialState: StoreSteamAccountItemStateAPI
    contextInfo: StoreSteamAccountApplicationContext
  }
) {
  const [store] = React.useState<StoreApi<StoreSteamAccountItem>>(
    () => createStoreSteamAccountItem(props.initialState, props.contextInfo) // pode ficar obsoleto ao mudar contexto do usuario, tentar mover user context para store
  )

  // React.useEffect(() => {
  //   store.setState(props.initialState)
  // }, [props.initialState, props.contextInfo])

  return (
    <ContextSteamAccountItemStore.Provider value={store}>
      {props.children}
    </ContextSteamAccountItemStore.Provider>
  )
}

export const useSteamAccountStore = <T,>(selector: (state: StoreSteamAccountItem) => T): T => {
  const context = React.useContext(ContextSteamAccountItemStore)
  if (!context) throw new Error("useSteamAccountStore: OOC")
  return useStore(context, selector)
}
