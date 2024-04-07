import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { UseSuspenseQueryOptions, useQuery } from "@tanstack/react-query"
import { UserAdminPanelSession } from "core"

type Options<TData = UserAdminPanelSession[]> = Omit<
  UseSuspenseQueryOptions<UserAdminPanelSession[], Error, TData>,
  "queryKey"
>

type GetAdminUsersListResponse = { usersAdminList: UserAdminPanelSession[]; code: "SUCCESS" }

export function useUserAdminList<TData = UserAdminPanelSession[]>(options = {} as Options<TData>) {
  return useQuery<UserAdminPanelSession[], Error, TData>({
    queryFn: async () => {
      const response = await api.get<GetAdminUsersListResponse>("/admin/users-list")

      return response.data.usersAdminList
    },
    queryKey: ECacheKeys["USER-ADMIN-ITEM-LIST"],
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 20,
    refetchOnWindowFocus: true,
    ...options,
  })
}

export function useUserAdminList$<TData = UserAdminPanelSession[]>(options = {} as Options<TData>) {
  const query = useUserAdminList(options)
  if (query.status !== "success") {
    throw new Error("Attempt to use user admin item bofore it was loaded.")
  }

  return query.data
}
