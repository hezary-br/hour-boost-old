import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage } from "@/util/DataOrMessage"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserAdminPanelSession } from "core"
import { produce } from "immer"
import { UserAdminActionUnbanUserPayload } from "./controller"
import { httpUserAdminActionUnbanUser } from "./httpRequest"
import { IntentionCodes } from "./types"

type UseUserAdminActionUnbanUserProps = {
  userId: string
}

export function useUserAdminActionUnbanUser({ userId }: UseUserAdminActionUnbanUserProps) {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<DataOrMessage<string, IntentionCodes>, DefaultError, UserAdminActionUnbanUserPayload>({
    mutationKey: ECacheKeys.unbanUser(userId),
    mutationFn: async (...args) => httpUserAdminActionUnbanUser(...args, getAPI),
    onSuccess(_, variables) {
      queryClient.setQueryData<UserAdminPanelSession[]>(ECacheKeys["USER-ADMIN-ITEM-LIST"], users => {
        return produce(users, users => {
          const user = users!.find(u => u.id_user === variables.unbanningUserId)!
          user.status = "ACTIVE"
        })
      })
      queryClient.invalidateQueries()
    },
  })
}

export type UserAdminActionUnbanUserResult = ReturnType<typeof useUserAdminActionUnbanUser>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
