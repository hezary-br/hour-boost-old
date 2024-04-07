import { GameSession, Persona, UserSession } from "core"
import React, { createContext } from "react"
import { create } from "zustand"
import { useUserQuery } from "./query/useUserSession"

export interface IUserContext extends UserSession, UserMethods {}
export namespace NSUserMethods {
  export type StartFarmProps = {
    when: string
    accountName: string
  }
}

export interface UserMethods {
  setGames(accountName: string, games: GameSession[]): void
  updatePersona(accountName: string, persona: Persona): void
  hasGames(): boolean
  updateFarmingGames(props: IUserMethods.UpdateFarmingGames): void
  isFarming(): boolean
  hasAccounts(): boolean
  startFarm(props: NSUserMethods.StartFarmProps): void
}

export interface IUserProviderProps {
  children: React.ReactNode
  serverUser: UserSession
}

export const UserContext = createContext<IUserContext>({} as IUserContext)
export const UserIdContext = createContext("")

type UserIdStore = {
  id: string
  setUserId(id: string): void
}
export const useUserStore = create<UserIdStore>(set => ({
  id: "NO_USER",
  setUserId: (id: string) => set({ id }),
}))

export function useUser<Select>(select: (user: UserSession) => Select) {
  return useUserQuery<Select>({
    select: userSession => {
      if (!userSession) throw new Error("Attempt to use user bofore it was loaded.")
      return select(userSession)
    },
  })
}

export function useUser$<Select>(select: (user: UserSession) => Select) {
  const user = useUser(select)
  if (user.status !== "success") {
    throw new Error("Attempt to use user bofore it was loaded.")
  }
  return user.data
}

export function useUserId() {
  return useUserStore(user => user.id)
  // return useContext(UserIdContext)
}

export namespace NSUserContext {
  export interface StageFarmingGames {
    accountName: string
    stageFarmingGames: number[]
  }
}

export namespace IUserMethods {
  export interface FarmGames {
    accountName: string
    gameId: number
  }

  export interface UpdateFarmingGames {
    accountName: string
    gameIdList: number[]
  }

  type Error = {
    message: string
  }

  export type DataOrError = [error: Error, data: null] | [error: null, data: UserSession]

  export type OnError = (error: Error) => void
}
