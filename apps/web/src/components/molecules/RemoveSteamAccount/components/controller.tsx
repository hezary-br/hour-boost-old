import { useUser$, useUserId } from "@/contexts/UserContext"
import { useUserSetterRemoveSteamAccount } from "@/contexts/user-actions"
import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { DataOrMessage } from "@/util/DataOrMessage"
import { useAuth } from "@clerk/clerk-react"
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { SteamAccountSession } from "core"
import React from "react"
import { toast } from "sonner"
import { RemoveSteamAccountPayload } from "../controller"
import { httpRemoveSteamAccount } from "../httpRequest"
import { AlertDialogRemoveSteamAccountView, AlertDialogRemoveSteamAccountViewProps } from "./alert-dialog"

export type ControllerProps = {
  steamAccount: SteamAccountSession
}

export type AlertDialogRemoveSteamAccountProps = AlertDialogRemoveSteamAccountViewProps & ControllerProps

export const AlertDialogRemoveSteamAccount = React.forwardRef<
  React.ElementRef<"div">,
  AlertDialogRemoveSteamAccountProps
>(function AlertDialogRemoveSteamAccountComponent({ ...props }, ref) {
  const queryClient = useQueryClient()
  const username = useUser$(user => user.username)
  const userId = useUserId()
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }
  const removeSteamAccountHook = useUserSetterRemoveSteamAccount(queryClient)

  const removeSteamAccount = useMutation<DataOrMessage<string>, DefaultError, RemoveSteamAccountPayload>({
    mutationFn: async (...args) => httpRemoveSteamAccount(...args, getAPI),
    onMutate({ accountName }) {
      removeSteamAccountHook(accountName)
    },
  })

  async function removeSteamAccountSubmit() {
    const toastId = toast.loading("Desvinculando conta.")
    const [error] = await removeSteamAccount.mutateAsync({
      accountName: props.steamAccount.accountName,
      steamAccountId: props.steamAccount.id_steamAccount,
      username: username,
    })
    toast.dismiss(toastId)
    if (error) {
      toast[error.type](error.message)
      return
    }
    toast.success("Conta da Steam removida do seu perfil.")
    queryClient.invalidateQueries({ queryKey: ECacheKeys.user_session(userId) })
  }

  return (
    <AlertDialogRemoveSteamAccountView
      {...props}
      ref={ref}
      handleAction={removeSteamAccountSubmit}
    />
  )
})

AlertDialogRemoveSteamAccount.displayName = "AlertDialogRemoveSteamAccount"
