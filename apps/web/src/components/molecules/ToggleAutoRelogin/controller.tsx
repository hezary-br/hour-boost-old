import { Switch } from "@/components/ui/switch"
import { useUser$, useUserId } from "@/contexts/UserContext"
import { api } from "@/lib/axios"
import { useAuth } from "@clerk/clerk-react"
import { SteamAccountSession } from "core"
import { useSteamAccountId } from "../SteamAccountListItem"
import { useToggleAutoReloginMutation } from "./mutation"

export interface ToggleAutoReloginPayload {
  userId: string
  accountName: string
}

export const ToggleAutoRelogin = () => {
  const { getAPI } = useFetch()
  const accountName = useSteamAccount(sa => sa.accountName)
  const autoRelogin = useSteamAccount(sa => sa.autoRelogin)
  const toggleAutoReloginMutation = useToggleAutoReloginMutation(accountName, getAPI)
  const userId = useUserId()

  const handleToggleAutoRelogin = () => {
    toggleAutoReloginMutation.mutate({
      accountName,
      userId,
    })
  }

  return (
    <Switch
      disabled={toggleAutoReloginMutation.isPending}
      checked={autoRelogin}
      onCheckedChange={handleToggleAutoRelogin}
      size="1.25rem"
    />
  )
}

export function useSteamAccount<Select>(select: (steamAccount: SteamAccountSession) => Select) {
  const steamAccountId = useSteamAccountId()
  const selection = useUser$(user => {
    const steamAccount = user.steamAccounts.find(sa => sa.id_steamAccount === steamAccountId)!
    return select(steamAccount)
  })
  return selection
}

export function useFetch() {
  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  return {
    getAPI,
  }
}
