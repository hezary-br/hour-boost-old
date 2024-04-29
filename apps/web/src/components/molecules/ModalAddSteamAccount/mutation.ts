import { CreateSteamAccountPayload } from "@/components/molecules/ModalAddSteamAccount/controller"
import { httpCreateSteamAccount } from "@/components/molecules/ModalAddSteamAccount/httpRequest"
import { Message } from "@/util/DataOrMessage"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosInstance } from "axios"

export function useCreateAccountMutation(
  getApi: () => Promise<AxiosInstance>
) {
  const queryClient = useQueryClient()
  return useMutation<string | Message<any>, DefaultError, CreateSteamAccountPayload>({
    mutationFn: async (...args) => httpCreateSteamAccount(...args, getApi),
    onSettled() {
      queryClient.invalidateQueries()
    }
  })
}


export type UseCreateAccountMutation = ReturnType<typeof useCreateAccountMutation>