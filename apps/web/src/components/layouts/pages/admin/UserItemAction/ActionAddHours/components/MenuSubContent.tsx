import { IconPlus } from "@/components/icons/IconPlus"
import { IconSpinner } from "@/components/icons/IconSpinner"
import { DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { secondsToHoursAndMinutes } from "@/lib/secondsToHoursAndMinutes"
import { cn } from "@/lib/utils"
import { ECacheKeys } from "@/mutations/queryKeys"
import { PlanUsageSession } from "core"
import React, { useState } from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"
import { useUserAdminListItem } from "../../../hooks/useUserAdminListItem"
import { isMutationPending } from "../../ActionSetGamesLimit/components/MenuSubContent"
import { HoverCard } from "../../components"
import { Pieces } from "../../components/MenuSubContentPieces"
import { useUserAdminItemId } from "../../context"
import { useUserAdminActionAddHours } from "../mutation"
import { Hours, Minutes } from "../value-objects"

export type ActionAddHoursMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuSubContent
> & {
  children?: React.ReactNode | null
}

export const ActionAddHoursMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  ActionAddHoursMenuSubContentProps
>(function ActionAddHoursMenuSubContentComponent({ children, ...props }, ref) {
  const [isSure, setIsSure] = useState(false)
  // const maxUsageTime = useUserAdminStore(state => state.maxUsageTime)
  const userId = useUserAdminItemId()
  const planId = useUserAdminListItem(userId, user => user.plan.id_plan)
  const maxUsageTime = useUserAdminListItem(userId, user => (user.plan as PlanUsageSession).maxUsageTime)

  const [hours, setHours] = useState("2")
  const [minutes, setMinutes] = useState("30")
  const finalHoursInSeconds = parseInt(hours) * 60 * 60 + parseInt(minutes) * 60

  const mutationAddHours = useUserAdminActionAddHours()

  const isPending = isMutationPending(ECacheKeys.addHours)

  const { hours: currentHours, minutes: currentMinutes } = secondsToHoursAndMinutes(maxUsageTime)
  const { hours: finalHours, minutes: finalMinutes } = secondsToHoursAndMinutes(
    finalHoursInSeconds + maxUsageTime
  )
  const shouldDisplayCurrentMinutes = currentMinutes > 0

  const handleClick = async () => {
    if (!isSure && finalHoursInSeconds === 0) return
    setIsSure(s => !s)

    if (isSure) {
      mutationAddHours.mutate(
        {
          usageTimeInSeconds: finalHoursInSeconds,
          mutatingUserId: userId,
        },
        {
          onSuccess([undesired, message]) {
            if (undesired) {
              toast[undesired.type](undesired.message)
              return
            }
            toast.success(message)
          },
        }
      )
    }
  }

  const handleHoursOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!/^\d+$/.test(value) && value !== "") return
    const valueUnparsed = value === "" ? 0 : parseInt(e.target.value)
    const [error, hours] = Hours.create(valueUnparsed)
    if (error) return
    setHours(hours.getValue())
  }

  const handleMinutesOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!/^\d+$/.test(value) && value !== "") return
    const valueUnparsed = value === "" ? 0 : parseInt(e.target.value)
    const [error, minutes] = Minutes.create(valueUnparsed)
    if (error) return
    setMinutes(minutes.getValue())
  }

  return (
    <Pieces.Container
      {...props}
      className={cn("border border-slate-900", props.className)}
      ref={ref}
    >
      <Pieces.Header>
        <Pieces.HeaderTitle>Tempo restante:</Pieces.HeaderTitle>
        <Pieces.HeaderSubjectAmount className="pl-2 font-medium text-white">
          <span>{currentHours}h</span>
          {shouldDisplayCurrentMinutes && <span> {currentMinutes}m</span>}
        </Pieces.HeaderSubjectAmount>
      </Pieces.Header>
      <Pieces.Footer>
        <Pieces.Input
          className="w-12"
          value={hours.toString().padStart(2, "0")}
          onChange={handleHoursOnChange}
        />
        <span className="pl-1 pr-2">h</span>
        <Pieces.Input
          className="w-12"
          value={minutes.toString().padStart(2, "0")}
          onChange={handleMinutesOnChange}
        />
        <span className="pl-1 pr-2">min</span>

        {isPending && (
          <Pieces.Loading>
            <IconSpinner
              color={twc.slate["200"]}
              className="size-3 animate-pulse"
            />
          </Pieces.Loading>
        )}
        {!isPending && (
          <Pieces.Trigger onClick={handleClick}>
            {!isSure && <IconPlus className="size-3 text-white" />}
            {isSure && children}
            <HoverCard data-open={isSure}>
              <p>- Máximo de horas -</p>
              <p className="bg-accent border-accent-500 mt-1 rounded-md border px-2 py-1 text-sm/none tabular-nums">
                De{" "}
                <strong>
                  {currentHours} horas {currentMinutes > 0 && `e ${currentMinutes} minutos`}{" "}
                </strong>
                para{" "}
                <strong>
                  {finalHours} horas {finalMinutes > 0 && `e ${finalMinutes} minutos`}
                </strong>
              </p>
              <span className="mt-1 text-xs text-slate-500">
                Tem certeza que deseja fazer essa alteração?
              </span>
            </HoverCard>
          </Pieces.Trigger>
        )}
      </Pieces.Footer>
    </Pieces.Container>
  )
})

ActionAddHoursMenuSubContent.displayName = "ActionAddHoursMenuSubContent"

export type ActionAddHoursMenuSubContentTriggerProps = React.ComponentPropsWithoutRef<"button"> & {}

export const ActionAddHoursMenuSubContentTrigger = React.forwardRef<
  React.ElementRef<"button">,
  ActionAddHoursMenuSubContentTriggerProps
>(function ActionAddHoursMenuSubContentTriggerComponent({ className, ...props }, ref) {
  return (
    <button
      {...props}
      className={cn("relative px-3 hover:bg-slate-800", className)}
      ref={ref}
    />
  )
})

ActionAddHoursMenuSubContentTrigger.displayName = "ActionAddHoursMenuSubContentTrigger"
