import { TimeSince } from "@/components/atoms/TimeSince"
import { IconJoystick } from "@/components/icons/IconJoystick"
import { IconScrollText } from "@/components/icons/IconScrollText"
import { IMG_USER_PLACEHOLDER } from "@/consts"
import { cn } from "@/lib/utils"
import { SteamAccountSession } from "core"
import React, { PropsWithChildren, createContext, useContext } from "react"
import { useUserAdminItemId } from "../UserItemAction/context"
import { useUserAdminListItem } from "../hooks/useUserAdminListItem"
import { ImagesGrid, ImagesGridContent, ImagesGridIconWrapper } from "./ImagesGrid"
import { SeeGamesSheet } from "./SeeGamesSheet"

export type SteamAccountAdminItemProps = React.ComponentPropsWithoutRef<"div"> & {}

const SteamAccountAdminItem = React.forwardRef<React.ElementRef<"div">, SteamAccountAdminItemProps>(
  function SteamAccountAdminItemComponent({ className, ...props }, ref) {
    const accountName = useSteamAccountAdminItem(sa => sa.accountName)
    const profilePictureUrl = useSteamAccountAdminItem(sa => sa.profilePictureUrl)
    const status = useSteamAccountAdminItem(sa => sa.status)
    const farmedTimeInSeconds = useSteamAccountAdminItem(sa => sa.farmedTimeInSeconds)
    const farmStartedAt = useSteamAccountAdminItem(sa => sa.farmStartedAt)
    const isRestoringConnection = useSteamAccountAdminItem(sa => sa.isRestoringConnection)

    return (
      <div
        {...props}
        className={cn("relative pl-[--sa-padding-left]", className)}
        ref={ref}
      >
        {isRestoringConnection && (
          <div className="absolute inset-0 z-50 flex cursor-not-allowed items-center justify-center bg-black/80 font-semibold text-white">
            Conta reconectando...
          </div>
        )}
        <div className="flex h-[--container-height] cursor-pointer select-none items-center hover:bg-slate-900/50">
          <div className="pr-2">
            <div className="grid h-[--container-height] w-[--container-height] place-items-center">
              <div className="grid h-11 w-11 place-items-center">
                <div className="relative h-10 w-10 overflow-hidden rounded shadow-lg shadow-black/50">
                  <img
                    src={profilePictureUrl ?? IMG_USER_PLACEHOLDER}
                    // alt={`${user.username}'s profile picture.`}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="inset-0 bg-black" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-full w-[--sa-name-width] flex-col justify-center">
            <span className="text-sm text-slate-300">{accountName}</span>
            <div className="flex items-center">
              <div
                className={cn(
                  "size-1 translate-y-0.5 rounded-full bg-slate-500",
                  status === "online" && "bg-green-500"
                )}
              />
              <span className="pl-1 text-xs text-slate-500">{status}</span>
            </div>
          </div>
          <div className="flex h-full w-[--sa-farm-since-width] items-center justify-center">
            {farmStartedAt ? (
              <TimeSinceFarmStartedAt farmStartedAt={new Date(farmStartedAt)} />
            ) : (
              <div className="flex gap-1 whitespace-nowrap text-sm font-medium leading-none text-slate-600">
                <span>não</span>
              </div>
            )}
          </div>
          <div className="flex h-full w-[--sa-farmed-time-width] items-center justify-center">
            <div className="relative flex tabular-nums">
              <div className="flex gap-1 whitespace-nowrap text-sm font-medium leading-none">
                {(farmedTimeInSeconds / 60 / 60).toFixed(2)}
                <span className="text-slate-600">horas</span>
              </div>
            </div>
          </div>
          <div className="ml-auto flex">
            <div className="flex h-full w-[--sa-games-width] items-center justify-center">
              <ImagesGridStagingGames />
            </div>
            <div className="flex h-full w-[--sa-games-width] items-center justify-center">
              <ImagesGridFarmingGames />
            </div>
          </div>
        </div>
      </div>
    )
  }
)

SteamAccountAdminItem.displayName = "SteamAccountAdminItem"

export type ImagesGridStagingGamesProps = React.ComponentPropsWithoutRef<"div"> & {}

export const ImagesGridStagingGames = React.memo(
  React.forwardRef<React.ElementRef<"div">, ImagesGridStagingGamesProps>(
    function ImagesGridStagingGamesComponent({ className, ...props }, ref) {
      const games = useSteamAccountAdminItem(sa => sa.games)
      const stagingGames = useSteamAccountAdminItem(sa => sa.stagingGames)
      const accountName = useSteamAccountAdminItem(sa => sa.accountName)

      const description: React.FC = () => (
        <p>
          Esses são os jogos que atualmente{" "}
          <strong className="font-semibold text-white">{accountName}</strong> possui em staging.
        </p>
      )

      return (
        <SeeGamesSheet
          description={description}
          title="Jogos em staging"
          choosedOnes={stagingGames}
          games={games}
        >
          <ImagesGrid
            {...props}
            className={cn("w-full", className)}
            ref={ref}
          >
            <ImagesGridIconWrapper>
              <IconScrollText className="size-4 text-slate-600 transition-all duration-150 group-hover:text-white" />
            </ImagesGridIconWrapper>
            <ImagesGridContent
              source={games!.filter(game => stagingGames.includes(game.id)).map(g => g.imageUrl)}
            />
          </ImagesGrid>
        </SeeGamesSheet>
      )
    }
  )
)

ImagesGridStagingGames.displayName = "ImagesGridStagingGames"

export type ImagesGridFarmingGamesProps = Omit<
  React.ComponentPropsWithoutRef<typeof ImagesGrid>,
  "children"
> & {}

export const ImagesGridFarmingGames = React.memo(
  React.forwardRef<React.ElementRef<typeof ImagesGrid>, ImagesGridFarmingGamesProps>(
    function ImagesGridFarmingGamesComponent({ className, ...props }, ref) {
      const games = useSteamAccountAdminItem(sa => sa.games)
      const farmingGames = useSteamAccountAdminItem(sa => sa.farmingGames)
      const accountName = useSteamAccountAdminItem(sa => sa.accountName)

      const description: React.FC = () => (
        <p>
          Esses são os jogos que atualmente{" "}
          <strong className="font-semibold text-white">{accountName}</strong> está farmando.
        </p>
      )

      return (
        <SeeGamesSheet
          description={description}
          title="Jogos farmando"
          choosedOnes={farmingGames}
          games={games}
        >
          <ImagesGrid
            {...props}
            className={cn("w-full", className)}
            ref={ref}
          >
            <ImagesGridIconWrapper>
              <IconJoystick className="size-4 fill-slate-600 transition-all duration-150 group-hover:fill-white" />
            </ImagesGridIconWrapper>
            <ImagesGridContent
              source={games!.filter(game => farmingGames.includes(game.id)).map(g => g.imageUrl)}
            />
          </ImagesGrid>
        </SeeGamesSheet>
      )
    }
  )
)

ImagesGridFarmingGames.displayName = "ImagesGridFarmingGames"

type TimeSinceFarmStartedAtProps = {
  farmStartedAt: Date | null
}

export function TimeSinceFarmStartedAt({ farmStartedAt }: TimeSinceFarmStartedAtProps) {
  if (!farmStartedAt) return <span>Sem informações do farm</span>

  return (
    <TimeSince.Root date={farmStartedAt}>
      <TimeSince.HighlightTime className="text-sm" />
    </TimeSince.Root>
  )
}

interface CSteamAccountAdminItemHooksContext {
  useSteamAccountAdminItem: <Selected>(
    select?: ((steamAccount: SteamAccountSession) => Selected) | undefined
  ) => Selected
}

export const SteamAccountAdminItemHooksContext = createContext({} as CSteamAccountAdminItemHooksContext)

/**
 * Hook
 */
export function useSteamAccountAdminItem<Selected>(
  selector: ((steamAccount: SteamAccountSession) => Selected) | undefined
) {
  const { useSteamAccountAdminItem } = useContext(SteamAccountAdminItemHooksContext)
  return useSteamAccountAdminItem<Selected>(selector)
}

/**
 * Provider
 */
type SteamAccountAdminItemHooksContextProviderProps = PropsWithChildren & {
  steamAccountId: string
}
function SteamAccountAdminItemHooksContextProvider({
  steamAccountId,
}: SteamAccountAdminItemHooksContextProviderProps) {
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

  return (
    <SteamAccountAdminItemHooksContext.Provider value={{ useSteamAccountAdminItem }}>
      <SteamAccountAdminItem />
    </SteamAccountAdminItemHooksContext.Provider>
  )
}

export { SteamAccountAdminItemHooksContextProvider as SteamAccountAdminItem }
