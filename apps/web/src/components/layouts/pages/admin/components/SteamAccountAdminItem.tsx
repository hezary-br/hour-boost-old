import React from "react"
import { cn } from "@/lib/utils"
import { SteamAccountSession } from "core"
import { ImagesGrid } from "./ImagesGrid"
import { IMG_USER_PLACEHOLDER } from "@/consts"
import { useUserAdminListItem } from "../hooks/useUserAdminListItem"
import { useUserAdminItemId } from "../UserItemAction/context"

export type SteamAccountAdminItemProps = React.ComponentPropsWithoutRef<"div"> & {
  steamAccountId: string
}

export const SteamAccountAdminItem = React.forwardRef<React.ElementRef<"div">, SteamAccountAdminItemProps>(
  function SteamAccountAdminItemComponent({ steamAccountId, className, ...props }, ref) {
    const userId = useUserAdminItemId()

    const useSteamAccountAdminItem = React.useCallback(
      function <Selected>(select?: (steamAccount: SteamAccountSession) => Selected) {
        return useUserAdminListItem<Selected>(userId, userList => {
          const foundSteamAccount = userList.steamAccounts.find(u => u.id_steamAccount === steamAccountId)!
          return select ? select(foundSteamAccount) : (foundSteamAccount as Selected)
        })
      },
      [userId]
    )

    const { accountName, profilePictureUrl, farmingGames, games } = useSteamAccountAdminItem(sa => ({
      profilePictureUrl: sa.profilePictureUrl,
      accountName: sa.accountName,
      games: sa.games,
      farmingGames: sa.farmingGames,
    }))

    return (
      <div
        {...props}
        className={cn("pl-10", className)}
        ref={ref}
      >
        <div className="select-none h-[--container-height] flex items-center bg-black/10 hover:bg-slate-900/50 cursor-pointer">
          <div className="h-[--container-height] w-[--container-height] grid place-items-center">
            <div className="h-11 w-11 grid place-items-center">
              <div className="h-10 w-10 relative shadow-lg shadow-black/50 rounded overflow-hidden">
                <img
                  src={profilePictureUrl ?? IMG_USER_PLACEHOLDER}
                  // alt={`${user.username}'s profile picture.`}
                  className="h-full w-full absolute inset-0"
                />
                <div className="inset-0 bg-black" />
              </div>
            </div>
          </div>
          <div className="w-20 px-2">
            <span className="text-sm text-slate-300">{accountName}</span>
          </div>
          <div className="px-2">
            <ImagesGrid source={games!.filter(game => farmingGames.includes(game.id)).map(g => g.imageUrl)} />
          </div>
        </div>
      </div>
    )
  }
)

SteamAccountAdminItem.displayName = "SteamAccountAdminItem"
