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
import React, { CSSProperties } from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"
import { ButtonAddNewAccount } from "./components"
import { useSteamAccountListItem } from "./context"
import { SteamAccountListItemViewProps } from "./types"

type SteamAccountListItemViewMobileProps = SteamAccountListItemViewProps

export const SteamAccountListItemViewMobile = React.memo(
  React.forwardRef<React.ElementRef<"div">, SteamAccountListItemViewMobileProps>(
    function SteamAccountListItemViewMobileComponent(
      { displayUpdateInServerMessage, handleClickFarmButton, actionText },
      ref
    ) {
      const { header, steamGuard, mutations, app, status } = useSteamAccountListItem()
      const { accountName, profilePictureUrl, farmStartedAt, isRestoringConnection } = app
      const autoRestarter = useUser(user => user.plan.autoRestarter)
      const isFarming = useSteamAccount(sa => sa.farmingGames.length > 0)

      const handleClickFarmButtonImpl = async () => {
        const [undesired, payload] = await handleClickFarmButton()
        if (undesired) return toast[undesired.type](undesired.message)
        if (payload instanceof Message) return toast[payload.type](payload.message)
        const { games, list } = payload
        showToastFarmingGame(list, games)
      }

      return (
        <div
          className={cn("relative flex flex-col border-t border-slate-800", header && "mt-[4.5rem]")}
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
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex">
              {isFarming && <div className="bg-accent h-[4.5rem] w-[0.25rem] animate-pulse" />}
              <div className={cn("relative h-[4.5rem] w-[4.5rem] shrink-0")}>
                <img
                  // src="https://avatarcloudflare.steamstatic.com/2ec38f7a0953fe2585abdda0757324dbbb519749_full.jpg"
                  src={profilePictureUrl ?? IMG_USER_PLACEHOLDER}
                  alt=""
                  className="fillimg"
                />
              </div>
            </div>
            <div className="flex grow flex-col leading-none">
              <strong className="text-lg">{accountName}</strong>
              <div className="flex text-xs">
                <span>Status: </span>
                <MenuDropdownChangeAccountStatus>
                  <button
                    disabled={mutations.changeAccountStatus.isPending}
                    className="flex translate-y-[1px] items-center focus:outline-none disabled:cursor-not-allowed"
                  >
                    <div
                      className={cn(
                        "ml-2 mr-1.5 h-1 w-1 rounded-full bg-slate-500",
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
            <div className="flex items-center">
              {steamGuard ? (
                <button className="group relative flex h-full items-center">
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
          </div>
          <ul
            className="flex flex-col gap-1 px-4 pt-3"
            style={
              {
                "--propertiesWidth": "8.5rem",
              } as CSSProperties
            }
          >
            <li className="flex min-h-[2.25rem]  items-center">
              <span className="w-[var(--propertiesWidth)] pr-3">Farmando:</span>
              <div className="pr-3">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-slate-500",
                    isFarming && "bg-accent animate-pulse"
                  )}
                />
              </div>
              <div className="">
                {isFarming ? (
                  <div className="flex h-full flex-col justify-center leading-none">
                    {farmStartedAt ? (
                      <TimeSince.Root
                        className="items-end gap-2"
                        date={new Date(farmStartedAt)}
                      >
                        <TimeSince.HighlightTime />
                        <TimeSince.SecondaryTime suspense={false} />
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
            </li>
            <li className="flex min-h-[2.25rem]  items-center">
              <span className="w-[var(--propertiesWidth)] whitespace-nowrap pr-3">Horas farmadas:</span>

              <div className="flex h-full flex-col justify-center leading-none">
                <div className="relative flex tabular-nums">
                  <div className="flex gap-1 whitespace-nowrap font-medium leading-none">
                    {(app.farmedTimeInSeconds / 60 / 60).toFixed(2)}
                    <span className="pl-1 text-slate-600">horas</span>
                  </div>
                  {/* <div className="absolute top-full">
              <span className="pt-0.5 leading-none text-xs text-slate-500 whitespace-nowrap">
                {farmedTimeSince.secondaryTime}
              </span>
            </div> */}
                </div>
              </div>
            </li>
            <li className="flex min-h-[2.25rem]  items-center">
              <span className="w-[var(--propertiesWidth)] pr-3">Auto restart:</span>
              <div className="flex h-full flex-col justify-center leading-none">
                {autoRestarter ? <ToggleAutoRelogin /> : null}
              </div>
            </li>
          </ul>
          <ul className="flex h-24">
            <li>
              <button className="flex h-full items-center px-4 transition-[background-color] duration-300 hover:bg-slate-700">
                <IconChart className="h-5 w-5 fill-white" />
              </button>
            </li>
            <li>
              <AlertDialogRemoveSteamAccount steamAccount={app}>
                <button className="flex h-full items-center px-4 transition-[background-color] duration-300 hover:bg-slate-700">
                  <IconTrash className="h-5 w-5" />
                </button>
              </AlertDialogRemoveSteamAccount>
            </li>
            <i className="my-auto h-1/2 border-r border-slate-700" />
            <li className="ml-auto">
              <ChooseFarmingGames />
              {/* <button className="relative py-2 flex items-center px-6 group hover:bg-slate-700 transition-[background-color] duration-300 h-full">
                  <div className="flex flex-col items-end">
                    <strong className="pb-0.5">Jogos</strong>
                    <div className="flex items-center gap-2 h-6 ">
                      <span className="uppercase text-sm">
                        {farmingGames.length}/{maxGamesAllowed}
                      </span>
                      <IconJoystick className="transition-[background-color] duration-300 h-4 w-4 fill-slate-500 group-hover:fill-white" />
                      <span className="transition-[background-color] duration-300 text-slate-500 group-hover:text-white">
                        +
                      </span>
                    </div>
                  </div>
                </button>
              </ChooseFarmingGames> */}
            </li>
          </ul>
          <div className="w-full">
            <button
              disabled={mutations.farmGames.isPending || mutations.stopFarm.isPending}
              className={cn(
                "flex h-20 w-full items-center justify-center bg-slate-800 px-8 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-900",
                isFarming && "bg-accent hover:bg-accent-500 disabled:bg-accent-700"
              )}
              onClick={handleClickFarmButtonImpl}
            >
              {actionText}
            </button>
          </div>
        </div>
      )
    }
  )
)

SteamAccountListItemViewMobile.displayName = "SteamAccountListItemViewMobile"
