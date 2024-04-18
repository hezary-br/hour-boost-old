import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserAdminPanelSession } from "core"
import { produce } from "immer"
import { UserAdminActionBanUserPayload } from "./controller"
import { httpUserAdminActionBanUser } from "./httpRequest"
import { IntentionCodes } from "./types"

type UseUserAdminActionBanUserProps = {
  userId: string
}

export function useUserAdminActionBanUser({ userId }: UseUserAdminActionBanUserProps) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<DataOrMessage<string, IntentionCodes>, DefaultError, UserAdminActionBanUserPayload>({
    mutationKey: ECacheKeys.banUser(userId),
    mutationFn: async (...args) =>
      httpUserAdminActionBanUser(...args, new MessageMaker<IntentionCodes>(), getToken),
    onSuccess(_, variables) {
      queryClient.setQueryData<UserAdminPanelSession[]>(ECacheKeys["USER-ADMIN-ITEM-LIST"], users => {
        return produce(users, users => {
          const user = users!.find(u => u.id_user === variables.banningUserId)!
          user.status = "BANNED"
        })
      })
      queryClient.invalidateQueries()
    },
  })
}

export type UserAdminActionBanUserResult = ReturnType<typeof useUserAdminActionBanUser>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
