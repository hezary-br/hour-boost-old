import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage } from "@/util/DataOrMessage"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserAdminPanelSession } from "core"
import { produce } from "immer"
import { UserAdminActionChangeUserPlanPayloadAll } from "./controller"
import { httpUserAdminActionChangeUserPlan } from "./httpRequest"
import { IntentionCodes } from "./types"

type UseUserAdminActionChangeUserPlanProps = {
  userId: string
}

export function useUserAdminActionChangeUserPlan({ userId }: UseUserAdminActionChangeUserPlanProps) {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<
    DataOrMessage<string, IntentionCodes>,
    DefaultError,
    UserAdminActionChangeUserPlanPayloadAll
  >({
    mutationKey: ECacheKeys.changeUserPlan(userId),
    mutationFn: async (...args) => httpUserAdminActionChangeUserPlan(...args, getAPI),
    onSuccess(_, variables) {
      queryClient.setQueryData<UserAdminPanelSession[]>(ECacheKeys["USER-ADMIN-ITEM-LIST"], users => {
        return produce(users, users => {
          const user = users!.find(u => u.id_user === variables.userId)!
          user.plan.custom = false
          user.plan.name = variables.newPlanValue
        })
      })
      queryClient.invalidateQueries()
    },
  })
}

export type UserAdminActionChangeUserPlanResult = ReturnType<typeof useUserAdminActionChangeUserPlan>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
