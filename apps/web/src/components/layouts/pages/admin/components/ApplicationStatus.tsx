import { cn } from "@/lib/utils"
import React from "react"
import { useUserAdminList } from "../hooks/useUserAdminList"

export type ApplicationStatusProps = React.ComponentPropsWithoutRef<"div"> & {}

export const ApplicationStatus = React.forwardRef<React.ElementRef<"div">, ApplicationStatusProps>(
  function ApplicationStatusComponent({ className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn(
          "mb-4 flex h-9 w-fit items-center rounded-md border border-blue-900/40 bg-blue-950/30 px-4 text-sm",
          className
        )}
        ref={ref}
      >
        <div className="flex items-center gap-2">
          <span>Usuários registrados:</span>
          <UserRegistered />
        </div>
        <div className="mx-4 h-full w-[1px] bg-blue-900/40" />
        <div className="flex items-center gap-2">
          <span>Contas registradas:</span>
          <SteamAccountsRegistered />
        </div>
        <div className="mx-4 h-full w-[1px] bg-blue-900/40" />
        <div className="flex items-center gap-2">
          <span>Contas farmando no momento:</span>
          <FarmingAccountsAmount />
        </div>
      </div>
    )
  }
)

export function FarmingAccountsAmount() {
  const { data: farmingAccountsAmount } = useUserAdminList({
    select: userList =>
      userList.reduce((acc, item) => {
        for (const sa of item.steamAccounts) {
          if (sa.farmingGames.length) acc++
        }
        return acc
      }, 0),
  })
  return <p className="font-medium">{farmingAccountsAmount}</p>
}

export function UserRegistered() {
  const { data: usersRegistered } = useUserAdminList({
    select: userList => userList.map(user => user.id_user).length,
  })
  return <p className="font-medium">{usersRegistered}</p>
}

export function SteamAccountsRegistered() {
  const { data: steamAccountsRegistered } = useUserAdminList({
    select: userList => {
      return userList.reduce((acc, item) => {
        for (const _ of item.steamAccounts) {
          acc++
        }
        return acc
      }, 0)
    },
  })

  return <p className="font-medium">{steamAccountsRegistered}</p>
}

ApplicationStatus.displayName = "ApplicationStatus"
