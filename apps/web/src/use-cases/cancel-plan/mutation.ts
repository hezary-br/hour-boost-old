import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { CancelSubscriptionPayloadAll } from "./controller"
import { httpCancelSubscription } from "./httpRequest"
import { UseCancelSubscriptionResult } from "./types"

export function useCancelSubscription(userId?: string) {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<UseCancelSubscriptionResult, DefaultError, CancelSubscriptionPayloadAll>({
    mutationKey: ECacheKeys.cancelSubscription(userId),
    mutationFn: async () => httpCancelSubscription(getAPI),
    onSettled() {
      queryClient.invalidateQueries()
    },
  })
}

export type CancelSubscriptionResult = ReturnType<typeof useCancelSubscription>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
