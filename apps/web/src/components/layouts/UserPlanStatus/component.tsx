import { IconJoystick } from "@/components/icons/IconJoystick"
import { getFarmedTimeSince } from "@/components/molecules/SteamAccountListItem"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { getPlanNameCheckIfCustom } from "@/util/getPlanName"
import { planIsUsage } from "@/util/thisPlanIsUsage"
import React from "react"
import { BadgePlanInfo, BadgePlanType } from "./components"

export function UserPlanStatus() {
  return (
    <div className="flex justify-between pt-12">
      <div className="flex"></div>
      <div className="flex">
        <div className="flex flex-col justify-end rounded-md border border-dashed border-slate-900 p-3">
          <div className="flex items-center justify-end gap-2">
            <span className="text-slate-400">Seu plano:</span>
            <BadgePlanTypeAsync />
          </div>
          <UserPlanInfoBadgesAsync />
        </div>
      </div>
    </div>
  )
}

function getTimePast(time: number) {
  const { highlightTime, secondaryTime } = getFarmedTimeSince(time)
  const SecondaryTime: React.FC = () =>
    secondaryTime.length ? <span className="text-sm text-zinc-400">{secondaryTime}</span> : null

  return {
    SecondaryTime,
    HighlightTime: () => highlightTime,
  }
}

function getTimePastInfinity() {
  return {
    SecondaryTime: () => null,
    HighlightTime: () => (
      <BadgePlanInfo.Icon className="fill-zinc-200">
        <IconInfinity />
      </BadgePlanInfo.Icon>
    ),
  }
}

export type IconUserProps = React.ComponentPropsWithoutRef<"svg">

export function IconUser({ className, ...props }: IconUserProps) {
  return (
    <svg
      {...props}
      className={cn("", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z" />
    </svg>
  )
}

export type IconHourGlassProps = React.ComponentPropsWithoutRef<"svg">

export function IconHourGlass({ className, ...props }: IconHourGlassProps) {
  return (
    <svg
      {...props}
      className={cn("", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <path d="M200,75.64V40a16,16,0,0,0-16-16H72A16,16,0,0,0,56,40V76a16.07,16.07,0,0,0,6.4,12.8L114.67,128,62.4,167.2A16.07,16.07,0,0,0,56,180v36a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V180.36a16.08,16.08,0,0,0-6.35-12.76L141.27,128l52.38-39.59A16.09,16.09,0,0,0,200,75.64ZM178.23,176H77.33L128,138ZM184,75.64,128,118,72,76V40H184Z" />
    </svg>
  )
}

export type IconClockProps = React.ComponentPropsWithoutRef<"svg">

export function IconClock({ className, ...props }: IconClockProps) {
  return (
    <svg
      {...props}
      className={cn("", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm56,112H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48a8,8,0,0,1,0,16Z" />
    </svg>
  )
}

export type IconInfinityProps = React.ComponentPropsWithoutRef<"svg">

export function IconInfinity({ className, ...props }: IconInfinityProps) {
  return (
    <svg
      {...props}
      className={cn("", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <path
        d="M101.28,158.17l-3.34,3.77a48,48,0,1,1,0-67.88l60.12,67.88a48,48,0,1,0,0-67.88l-3.34,3.77"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}

export type BadgePlanTypeAsyncProps = React.ComponentPropsWithoutRef<typeof BadgePlanType>

export const BadgePlanTypeAsync = React.forwardRef<
  React.ElementRef<typeof BadgePlanType>,
  BadgePlanTypeAsyncProps
>(function BadgePlanTypeAsyncComponent({ className, ...props }, ref) {
  const planCustom = useUser(user => user.plan.custom)
  const planName = useUser(user => user.plan.name)

  if (planCustom.status !== "success" || planName.status !== "success") {
    return <div className="h-[1.625rem] w-[3.75rem] animate-pulse bg-slate-800" />
  }

  const _planName = getPlanNameCheckIfCustom(planName.data, planCustom.data)

  return (
    <BadgePlanType
      ref={ref}
      className={cn("", className)}
      name={planName.data}
      {...props}
    >
      <span className="font-semibold leading-none">{_planName}</span>
    </BadgePlanType>
  )
})

export type UserPlanInfoBadgesAsyncProps = {}

export const UserPlanInfoBadgesAsync = () => {
  const maxGamesAllowed = useUser(user => user.plan.maxGamesAllowed)
  const maxSteamAccounts = useUser(user => user.plan.maxSteamAccounts)
  const _planIsUsage = useUser(user => planIsUsage(user.plan))
  const maxUsageTime = useUser(user => (planIsUsage(user.plan) ? user.plan.maxUsageTime : 0))
  const farmUsedTime = useUser(user => (planIsUsage(user.plan) ? user.plan.farmUsedTime : 0))

  if (
    maxGamesAllowed.status !== "success" ||
    maxSteamAccounts.status !== "success" ||
    _planIsUsage.status !== "success" ||
    maxUsageTime.status !== "success" ||
    farmUsedTime.status !== "success"
  ) {
    return (
      <div>
        <div className="flex select-none justify-end gap-2 pt-2">
          <div className="h-[1.375rem] w-[5.2rem] animate-pulse bg-slate-800"></div>
          <div className="h-[1.375rem] w-[5.2rem] animate-pulse bg-slate-800"></div>
        </div>
        <div className="flex select-none justify-end gap-2 pt-2">
          <div className="h-[1.375rem] w-[7.2rem] animate-pulse bg-slate-800"></div>
        </div>
        <div className="flex select-none justify-end gap-2 pt-2">
          <div className="h-[1.375rem] w-[7rem] animate-pulse bg-slate-800"></div>
        </div>
      </div>
    )
  }

  const maxUsage = _planIsUsage.data ? getTimePast(maxUsageTime.data) : getTimePastInfinity()
  const remaining = _planIsUsage.data
    ? getTimePast(maxUsageTime.data - farmUsedTime.data)
    : getTimePastInfinity()

  return (
    <>
      <div className="flex select-none justify-end gap-2 pt-2">
        <HoverCard
          openDelay={300}
          closeDelay={0}
        >
          <HoverCardTrigger asChild>
            <BadgePlanInfo.Root className="hover:cursor-pointer hover:ring-2 hover:ring-slate-900/70">
              <BadgePlanInfo.Number className="border-slate-700 bg-slate-800">
                {maxGamesAllowed.data}
              </BadgePlanInfo.Number>
              <BadgePlanInfo.SubWrapper className="border-slate-700 bg-slate-600 text-slate-300">
                <BadgePlanInfo.Icon className="fill-slate-200">
                  <IconJoystick />
                </BadgePlanInfo.Icon>
                <BadgePlanInfo.Label>max</BadgePlanInfo.Label>
              </BadgePlanInfo.SubWrapper>
            </BadgePlanInfo.Root>
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-slate-300">
              Quantidade máxima de jogos que você consegue farmar simultâneamente em uma conta da Steam.
            </p>
          </HoverCardContent>
        </HoverCard>
        <HoverCard
          openDelay={300}
          closeDelay={0}
        >
          <HoverCardTrigger asChild>
            <BadgePlanInfo.Root className="hover:cursor-pointer hover:ring-2 hover:ring-slate-900/70">
              <BadgePlanInfo.Number className="border-slate-700 bg-slate-800">
                {maxSteamAccounts.data}
              </BadgePlanInfo.Number>
              <BadgePlanInfo.SubWrapper className="border-slate-700 bg-slate-600 text-slate-300">
                <BadgePlanInfo.Icon className="fill-slate-200">
                  <IconUser />
                </BadgePlanInfo.Icon>
                <BadgePlanInfo.Label>max</BadgePlanInfo.Label>
              </BadgePlanInfo.SubWrapper>
            </BadgePlanInfo.Root>
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-slate-300">
              Quantidade máxima de contas da Steam que você pode adicionar no seu painel.
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div className="flex select-none justify-end gap-2 pt-2">
        <HoverCard
          openDelay={300}
          closeDelay={0}
        >
          <HoverCardTrigger asChild>
            <BadgePlanInfo.Root className="hover:cursor-pointer hover:ring-2 hover:ring-zinc-900/70">
              <BadgePlanInfo.SubWrapper className="border-zinc-700 bg-zinc-600 text-zinc-300">
                <BadgePlanInfo.Icon className="fill-zinc-200">
                  <IconClock />
                </BadgePlanInfo.Icon>
                <BadgePlanInfo.Label>no máximo</BadgePlanInfo.Label>
              </BadgePlanInfo.SubWrapper>
              <BadgePlanInfo.Number className="border-zinc-700 bg-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-white">
                    <maxUsage.HighlightTime />
                  </span>
                  <maxUsage.SecondaryTime />
                </div>
              </BadgePlanInfo.Number>
            </BadgePlanInfo.Root>
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-slate-300">Quantidade máxima de tempo que seu plano permite você farmar.</p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div className="flex select-none justify-end gap-2 pt-2">
        <HoverCard
          openDelay={300}
          closeDelay={0}
        >
          <HoverCardTrigger asChild>
            <BadgePlanInfo.Root className="hover:cursor-pointer hover:ring-2 hover:ring-slate-900/70">
              <BadgePlanInfo.Number className="border-slate-700 bg-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-white">
                    <remaining.HighlightTime />
                  </span>
                  <remaining.SecondaryTime />
                </div>
              </BadgePlanInfo.Number>
              <BadgePlanInfo.SubWrapper className="border-slate-700 bg-slate-600 text-slate-300">
                <BadgePlanInfo.Label>restantes</BadgePlanInfo.Label>
                <BadgePlanInfo.Icon className="fill-slate-200">
                  <IconHourGlass />
                </BadgePlanInfo.Icon>
              </BadgePlanInfo.SubWrapper>
            </BadgePlanInfo.Root>
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-slate-300">
              Quantidade tempo restante que você ainda pode farmar na Hourboost.
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
    </>
  )
}
