import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage } from "@/util/DataOrMessage"
import { planIsUsage } from "@/util/thisPlanIsUsage"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserAdminPanelSession } from "core"
import { produce } from "immer"
import { UserAdminActionAddHoursPayload } from "./controller"
import { httpUserAdminActionAddHours } from "./httpRequest"
import { IntentionCodes } from "./types"

export function useUserAdminActionAddHours() {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<DataOrMessage<string, IntentionCodes>, DefaultError, UserAdminActionAddHoursPayload>({
    mutationKey: ECacheKeys.addHours,
    mutationFn: async (...args) => httpUserAdminActionAddHours(...args, getAPI),
    onSuccess(_, variables) {
      queryClient.invalidateQueries({ queryKey: ECacheKeys["USER-ADMIN-ITEM-LIST"] })
      queryClient.setQueryData<UserAdminPanelSession[]>(ECacheKeys["USER-ADMIN-ITEM-LIST"], users => {
        return produce(users, users => {
          const user = users!.find(u => u.id_user === variables.mutatingUserId)!
          if (planIsUsage(user.plan)) {
            user.plan.maxUsageTime += variables.usageTimeInSeconds
          }
        })
      })
    },
  })
}

export type UserAdminActionAddHoursResult = ReturnType<typeof useUserAdminActionAddHours>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
