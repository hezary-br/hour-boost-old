import { QueryClient } from "@tanstack/react-query"
import { UserSession } from "core"

export function getUserActionsMakerWrapper(queryClient: QueryClient) {
  return function setProvider(setter: (user: UserSession) => UserSession) {
    queryClient.setQueryData<UserSession>(["me"], user => {
      if (!user) throw new Error(`There is no user on query provider with key ["me"]`)
      return setter(user!)
    })
  }
}
