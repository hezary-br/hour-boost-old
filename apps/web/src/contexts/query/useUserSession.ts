import { useUserStore } from "@/contexts/UserContext"
import { useServerMeta } from "@/contexts/server-meta"
import { api } from "@/lib/axios"
import { GetMeResponse } from "@/pages/dashboard"
import { useAuth } from "@clerk/clerk-react"
import { UseSuspenseQueryOptions, useQuery } from "@tanstack/react-query"
import { UserSession } from "core"

type UserQueryOptions<TData = UserSession | null> = Omit<
  UseSuspenseQueryOptions<UserSession | null, Error, TData>,
  "queryKey"
>

export function useUserQuery<TData = UserSession | null>(options = {} as UserQueryOptions<TData>) {
  const { getToken } = useAuth()
  const hasSession = !!useServerMeta()?.session
  const setUserId = useUserStore(user => user.setUserId)
  return useQuery<UserSession | null, Error, TData>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken()
      const { data: meResponse } = await api
        .get<GetMeResponse>("/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .catch(e => {
          console.log(e)
          throw e
        })
      if (meResponse.userSession) setUserId(meResponse.userSession.id)
      return meResponse.userSession
    },
    // enabled: hasSession,
    refetchInterval: 6000 * 3,
    staleTime: 1000, // 1s
    retry: 5,
    ...options,
  })
}
