import { StopFarmPayload } from "@/components/molecules/StopFarm/controller"
import { httpStopFarm } from "@/components/molecules/StopFarm/httpRequest"
import { IntentionCodes } from "@/components/molecules/StopFarm/types"
import { useUserSetterStopFarm } from "@/contexts/user-actions"
import { DataOrMessage } from "@/util/DataOrMessage"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosInstance } from "axios"

export function useStopFarmMutation(getApi: () => Promise<AxiosInstance>) {
  const queryClient = useQueryClient()
  const stopFarm = useUserSetterStopFarm(queryClient)

  return useMutation<DataOrMessage<string, IntentionCodes>, DefaultError, StopFarmPayload>({
    mutationFn: async (...args) => httpStopFarm(...args, getApi),
    onSuccess(_, { accountName }) {
      stopFarm(accountName)
    },
    onSettled() {
      queryClient.invalidateQueries()
    }
  })
}

export type StopFarmMutationResult = ReturnType<typeof useStopFarmMutation>
