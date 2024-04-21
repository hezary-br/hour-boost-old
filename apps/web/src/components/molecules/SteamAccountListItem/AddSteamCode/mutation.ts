import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage } from "@/util/DataOrMessage"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { AddSteamGuardPayload } from "./controller"
import { httpAddSteamGuard } from "./httpRequest"
import { IntentionCodes } from "./types"

type UseAddSteamGuardProps = {
  accountName: string
}

export function useAddSteamGuard({ accountName }: UseAddSteamGuardProps) {
  const queryClient = useQueryClient()
  const { getAPI } = useGetAPI()

  return useMutation<DataOrMessage<string, IntentionCodes>, DefaultError, AddSteamGuardPayload>({
    mutationKey: ECacheKeys.addSteamGuard(accountName),
    mutationFn: async (...args) => httpAddSteamGuard(...args, getAPI),
    onSettled() {
      queryClient.invalidateQueries()
    },
  })
}

export type AddSteamGuardResult = ReturnType<typeof useAddSteamGuard>

export function useGetAPI() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return { getAPI }
}
