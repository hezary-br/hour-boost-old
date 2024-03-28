import { TimeSince } from "@/components/atoms/TimeSince"
import { IconChart } from "@/components/icons/IconChart"
import { IconDeviceMobile } from "@/components/icons/IconDeviceMobile"
import { IconSpinner } from "@/components/icons/IconSpinner"
import { IconTrash } from "@/components/icons/IconTrash"
import { MenuDropdownChangeAccountStatus } from "@/components/molecules/ChangeAccountStatus/components"
import { ChooseFarmingGames } from "@/components/molecules/FarmGames/controller"
import { AlertDialogRemoveSteamAccount } from "@/components/molecules/RemoveSteamAccount/components/controller"
import { ToggleAutoRelogin, useSteamAccount } from "@/components/molecules/ToggleAutoRelogin/controller"
import { IMG_USER_PLACEHOLDER } from "@/consts"
import { useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { Message } from "@/util/DataOrMessage"
import { showToastFarmingGame } from "@/util/toaster"
import React from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"
import { ButtonAddNewAccount } from "./components"
import { useSteamAccountListItem } from "./context"
import { SteamAccountListItemViewProps } from "./types"

type SteamAccountListItemViewDesktopProps = SteamAccountListItemViewProps

export const SteamAccountListItemViewDesktop = React.memo(
  React.forwardRef<React.ElementRef<"div">, SteamAccountListItemViewDesktopProps>(
    function SteamAccountListItemViewDesktopComponent({ displayUpdateInServerMessage, handleClickFarmButton, actionText }, ref) {
      const { header, steamGuard, app, mutations, hasUsagePlanLeft, status } = useSteamAccountListItem()
      const { accountName, profilePictureUrl, farmStartedAt, isRestoringConnection } = app
      const plan = useUser(u => u.plan)
      const isFarming = useSteamAccount(sa => sa.farmingGames.length > 0)

      const handleClickFarmButtonImpl = async () => {
        const [undesired, payload] = await handleClickFarmButton()
        if (undesired) return toast[undesired.type](undesired.message)
        if (payload instanceof Message) return toast[payload.type](payload.message)
        const { games, list } = payload
        showToastFarmingGame(list, games)
      }

      // const farmedTimeSince = getFarmedTimeSince(app.farmedTimeInSeconds)

      return (
        <div
          className={cn("relative flex h-[4.5rem] border border-slate-800", header && "mt-[4.5rem]")}
          ref={ref}
        >
          {isRestoringConnection && (
            <div className="absolute inset-0 z-50 flex cursor-not-allowed items-center justify-center bg-black/80 text-white">
              <div className="flex flex-col items-center">
                {displayUpdateInServerMessage && (
                  <span className="text-sm text-slate-300">
                  Houve updates no servidor e ele precisou ser reiniciado 😁
                </span>
                )}
                <span className="font-semibold">A conta está reconectando...</span>
              </div>
            </div>
          )}

          {header && (
            <div className="absolute bottom-full left-4">
              <ButtonAddNewAccount />
            </div>
          )}
          {isFarming && (
            <div className="bg-accent absolute bottom-0 right-full top-0 w-[0.25rem] animate-pulse" />
          )}
          <div className="flex items-center">
            {steamGuard ? (
              <button className="group relative flex h-full items-center px-6">
                <div className="absolute inset-0 animate-pulse bg-slate-800 group-hover:animate-none" />
                <div className="relative z-10">
                  <span className="absolute right-0 top-0 flex h-2 w-2 -translate-y-1/2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                  <IconDeviceMobile className="h-5 w-5" />
                </div>
              </button>
            ) : (
              <div className="flex h-full items-center px-6">
                <IconDeviceMobile className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex w-full max-w-[19rem] items-center gap-4 overflow-hidden pr-6">
            <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
              <img
                // src="https://avatarcloudflare.steamstatic.com/2ec38f7a0953fe2585abdda0757324dbbb519749_full.jpg"
                src={profilePictureUrl ?? IMG_USER_PLACEHOLDER}
                alt=""
                className="fillimg"
              />
            </div>
            <div className="flex flex-col leading-none">
              <strong>{accountName}</strong>
              <div className="mt-1 flex items-center gap-1 text-xs ">
                <MenuDropdownChangeAccountStatus>
                  <button
                    disabled={mutations.changeAccountStatus.isPending}
                    className="flex items-center focus:outline-none disabled:cursor-not-allowed"
                  >
                    <div
                      className={cn(
                        "mr-1.5 h-1 w-1 rounded-full bg-slate-500",
                        status === "online" && "bg-green-500"
                      )}
                    />
                    <span
                      className={cn(
                        "-translate-y-[2px] cursor-pointer select-none pr-2 text-slate-300 hover:underline",
                        status === "offline" && "text-slate-500"
                      )}
                    >
                      {status}
                    </span>
                    {mutations.changeAccountStatus.isPending && (
                      <div className="-translate-y-[1px]">
                        <IconSpinner
                          color={twc.blue["500"]}
                          className="h-3 w-3"
                        />
                      </div>
                    )}
                  </button>
                </MenuDropdownChangeAccountStatus>
              </div>
            </div>
          </div>
          <div className="relative flex min-w-[8.5rem] items-center px-6">
            <div className="pr-2">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-slate-500",
                  isFarming && "bg-accent animate-pulse"
                )}
              />
            </div>
            {header && (
              <div className="absolute bottom-full left-0 right-0 px-6 py-2">
                <span>farmando</span>
              </div>
            )}
            {isFarming ? (
              <div className="flex h-full flex-col justify-center leading-none">
                {/* <span className="uppercase">2.5 horas</span> */}
                {/* <span className="text-sm text-slate-500">153 min</span> */}
                {farmStartedAt ? (
                  <TimeSince.Root date={new Date(farmStartedAt)}>
                    <TimeSince.HighlightTime className="text-sm" />
                    <TimeSince.SecondaryTime className="text-xs" />
                  </TimeSince.Root>
                ) : (
                  <span>Sem informações do farm</span>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center leading-none">
                <span className="text-slate-500">0 horas</span>
              </div>
            )}
          </div>
          <div className="group relative flex min-w-[8.5rem] cursor-default items-center whitespace-nowrap px-6">
            {header && (
              <div className="absolute bottom-full left-0 right-0 px-6 py-2">
                <span>
                  horas
                  <br />
                  farmadas
                </span>
              </div>
            )}
            <div className="mx-auto flex flex-col">
              <div className="relative flex tabular-nums">
                <div className="flex gap-1 whitespace-nowrap text-sm font-medium leading-none">
                  {(app.farmedTimeInSeconds / 60 / 60).toFixed(2)}
                  <span className="text-slate-600">horas</span>
                </div>
                {/* <div className="absolute top-full">
              <span className="pt-0.5 leading-none text-xs text-slate-500 whitespace-nowrap">
                {farmedTimeSince.secondaryTime}
              </span>
            </div> */}
              </div>
              {/* <span className="leading-none text-[0.75rem]/[0.75rem] text-slate-500">nessa conta</span> */}
            </div>
          </div>
          <div className="relative flex items-center ">
            {header && (
              <div className="absolute bottom-full left-0 right-0 px-6 py-2">
                <span>jogos</span>
              </div>
            )}

            <ChooseFarmingGames />
          </div>
          <div className="ml-auto flex items-center">
            {plan.autoRestarter ? (
              <div className="relative flex h-full items-center px-4">
                {header && (
                  <div className="absolute bottom-full left-0 right-0 px-6 py-2">
                    <span>auto-restarter</span>
                  </div>
                )}
                <ToggleAutoRelogin />
              </div>
            ) : null}
            <button className="flex h-full items-center px-4 transition-all duration-300 hover:bg-slate-700">
              <IconChart className="h-5 w-5 fill-white" />
            </button>
            <AlertDialogRemoveSteamAccount steamAccount={app}>
              <button className="flex h-full items-center px-4 transition-all duration-300 hover:bg-slate-700">
                <IconTrash className="h-5 w-5" />
              </button>
            </AlertDialogRemoveSteamAccount>
            <button
              disabled={mutations.farmGames.isPending || mutations.stopFarm.isPending || !hasUsagePlanLeft}
              className={cn(
                "flex h-full min-w-[12.6rem] items-center justify-center bg-slate-800 px-8 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-900",
                isFarming && "bg-accent hover:bg-accent-500 disabled:bg-accent-700"
              )}
              onClick={handleClickFarmButtonImpl}
            >
              {hasUsagePlanLeft ? actionText : "Seu plano acabou"}
            </button>
          </div>
        </div>
      )
    }
  )
)

// PROGRESS BAR
{
  /* <div className="flex items-center gap-2 ">
  <div className="h-1 w-full flex items-center bg-slate-700">
    <div className="h-full relative bg-accent w-[40%]">
      <div className="absolute right-0 top-full translate-x-1/2 opacity-0 group-hover:opacity-100 transition-[opacity] duration-300">
        <i className="absolute left-1/2 top-0 translate-x-[-1px] border-r border-accent h-[0.25rem]" />
        <span className="text-sm">40%</span>
      </div>
    </div>
  </div>
</div> */
}

SteamAccountListItemViewDesktop.displayName = "SteamAccountListItem"
