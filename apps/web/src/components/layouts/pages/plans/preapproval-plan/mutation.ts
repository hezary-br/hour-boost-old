import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { PreApprovalPlanPayloadAll } from "./controller"
import { httpPreApprovalPlan } from "./httpRequest"
import { UsePreApprovalPlanResult } from "./types"

export function usePreApprovalPlan(planName: string, userId?: string) {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<UsePreApprovalPlanResult, DefaultError, PreApprovalPlanPayloadAll>({
    mutationKey: ECacheKeys.preAprovalPlan(planName, userId),
    mutationFn: async (...args) => httpPreApprovalPlan(...args, getAPI),
    onSettled() {
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
