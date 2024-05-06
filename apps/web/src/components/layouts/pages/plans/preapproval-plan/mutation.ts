import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { PreApprovalPlanPayloadAll } from "./controller"
import { httpPreApprovalPlan } from "./httpRequest"

type UsePreApprovalPlanProps = {
  userId?: string
}

export function usePreApprovalPlan({ userId }: UsePreApprovalPlanProps) {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<
    void,
    DefaultError,
    PreApprovalPlanPayloadAll
  >({
    mutationKey: ECacheKeys.preAprovalPlan(userId),
    mutationFn: async (...args) => httpPreApprovalPlan(...args, getAPI),
    onSuccess() {
      queryClient.invalidateQueries()
    },
  })
}

export type PreApprovalPlanResult = ReturnType<typeof usePreApprovalPlan>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
