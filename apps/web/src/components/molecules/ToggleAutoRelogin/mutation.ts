import { useUserSetterToggleAutoRestart } from "@/contexts/user-actions"
import { DataOrMessage } from "@/util/DataOrMessage"
import { DefaultError, useMutation } from "@tanstack/react-query"
import { AxiosInstance } from "axios"
import { ToggleAutoReloginPayload } from "./controller"
import { httpToggleAutoRelogin } from "./httpRequest"
import { IntentionCodes } from "./types"

export function useToggleAutoReloginMutation(accountName: string, getApi: () => Promise<AxiosInstance>) {
  const toggleAutoRelogin = useUserSetterToggleAutoRestart()

  return useMutation<DataOrMessage<string, IntentionCodes>, DefaultError, ToggleAutoReloginPayload>({
    mutationFn: async (...args) => httpToggleAutoRelogin(...args, getApi),
    onSuccess() {
      toggleAutoRelogin(accountName)
    },
  })
}

export type ToggleAutoReloginMutationResult = ReturnType<typeof useToggleAutoReloginMutation>
