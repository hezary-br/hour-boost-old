import { useUserStore } from "@/contexts/UserContext"
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
  const setUserId = useUserStore(user => user.setUserId)
  return useQuery<UserSession | null, Error, TData>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken()
      const { data: meResponse } = await api.get<GetMeResponse>("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (meResponse.userSession) setUserId(meResponse.userSession.id)
      return meResponse.userSession
    },
    refetchInterval: 6000 * 3,
    staleTime: 6000 * 3,
    ...options,
  })
}
