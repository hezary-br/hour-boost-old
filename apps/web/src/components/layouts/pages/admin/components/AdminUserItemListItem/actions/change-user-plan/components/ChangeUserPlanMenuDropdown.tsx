import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { getPlanName } from "@/util/getPlanName"
import React, { useRef } from "react"

import { useUserAdminActionChangeUserPlan } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/actions/change-user-plan/mutation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useMutationState } from "@tanstack/react-query"
import { PlanAllNames } from "core"
import { toast } from "sonner"

export type ChangeUserPlanProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent>

export const ChangeUserPlanMenuDropdown = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  ChangeUserPlanProps
>(function ChangeUserPlanComponent({ children, className, ...props }, ref) {
  const userId = useUserAdminItemId()
  const username = useUserAdminListItem(userId, user => user.username)
  const currentPlanName = getPlanName(useUserAdminListItem(userId, user => user.plan.name))
  const refConfirmToastId = useRef<string | number | null>()

  const changeUserPlan = useUserAdminActionChangeUserPlan({ userId })

  function changeUserPlanMutation(plan: TypePlans) {
    changeUserPlan.mutate(
      {
        newPlanName: plan.name,
        newPlanValue: plan.value,
        userId,
        username,
        oldPlanName: currentPlanName,
      },
      {
        onSettled() {
          if (refConfirmToastId.current) toast.dismiss(refConfirmToastId.current)
        },
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

  function changePlanConfirmToast(plan: TypePlans) {
    refConfirmToastId.current = toast(
      <ChangePlanConfirmToastMessageComponent
        userId={userId}
        username={username}
        currentPlanName={currentPlanName}
        planName={plan.name}
        onActionClick={() => changeUserPlanMutation(plan)}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border border-transparent ring-2 ring-transparent transition-all duration-300 hover:border-white/30 hover:ring-white/10">
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {plans.map(plan => (
          <DropdownMenuItem
            onClick={() => {
              changePlanConfirmToast(plan)
            }}
            key={plan.value}
          >
            {plan.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

type ChangePlanConfirmToastMessageComponent = {
  userId: string
  username: string
  currentPlanName: string
  planName: string
  onActionClick(): void
}

export function ChangePlanConfirmToastMessageComponent({
  userId,
  planName,
  currentPlanName,
  username,
  onActionClick,
}: ChangePlanConfirmToastMessageComponent) {
  const mutation = useMutationState({
    filters: {
      mutationKey: ECacheKeys.changeUserPlan(userId),
    },
  })

  const mutationsPending = mutation.filter(m => m.status === "pending")
  const hasMutationPending = mutationsPending.length > 0

  return (
    <>
      {planName === currentPlanName ? (
        <p>
          Deseja <strong>resetar</strong> o plano de {username}? <strong>({planName})</strong>
        </p>
      ) : (
        <p>
          Deseja mudar o plano de {username} de <strong>{currentPlanName}</strong> para{" "}
          <strong>{planName}</strong>?
        </p>
      )}
      <Button
        onClick={onActionClick}
        size="sm"
        disabled={hasMutationPending}
      >
        Confirmar
      </Button>
    </>
  )
}

type TypePlans = {
  name: string
  value: PlanAllNames
}

const plans: TypePlans[] = [
  {
    name: "Convidado",
    value: "GUEST",
  },
  {
    name: "Prata",
    value: "SILVER",
  },
  {
    name: "Ouro",
    value: "GOLD",
  },
  {
    name: "Diamante",
    value: "DIAMOND",
  },
]
