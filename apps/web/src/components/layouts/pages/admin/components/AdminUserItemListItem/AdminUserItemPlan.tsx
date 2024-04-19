import { BadgePlanType } from "@/components/layouts/UserPlanStatus/components"
import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { cn } from "@/lib/utils"
import { getPlanName, getPlanNameCheckIfCustom } from "@/util/getPlanName"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlanAllNames } from "core"
import { toast } from "sonner"

export type AdminUserItemPlanProps = React.ComponentPropsWithoutRef<"div"> & {}

export const AdminUserItemPlan = React.forwardRef<React.ElementRef<"div">, AdminUserItemPlanProps>(
  function AdminUserItemPlanComponent({ className, ...props }, ref) {
    const userId = useUserAdminItemId()
    const planCustom = useUserAdminListItem(userId, user => user.plan.custom)
    const planNameDomain = useUserAdminListItem(userId, user => user.plan.name)

    const planName = getPlanNameCheckIfCustom(planNameDomain, planCustom)
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        <div className="flex w-20 justify-center whitespace-nowrap">
          <ChangeUserPlan>
            <BadgePlanType
              size="sm"
              name={planNameDomain}
            >
              {planName}
            </BadgePlanType>
          </ChangeUserPlan>
        </div>
      </div>
    )
  }
)

export type ChangeUserPlanProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent>

export const ChangeUserPlan = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  ChangeUserPlanProps
>(function ChangeUserPlanComponent({ children, className, ...props }, ref) {
  const userId = useUserAdminItemId()
  const username = useUserAdminListItem(userId, user => user.username)
  const currentPlanName = getPlanName(useUserAdminListItem(userId, user => user.plan.name))

  function changePlanConfirmToast(plan: TypePlans) {
    toast(
      <ChangePlanConfirmToastMessageComponent
        username={username}
        currentPlanName={currentPlanName}
        planName={plan.name}
        onActionConfirm={() => console.log("mutate", [userId, plan.value])}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:ring-accent-700/50 hover:border-accent border border-transparent ring-2 ring-transparent transition-all duration-300">
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
  username: string
  currentPlanName: string
  planName: string
  onActionConfirm(): void
}

export function ChangePlanConfirmToastMessageComponent({
  planName,
  currentPlanName,
  username,
  onActionConfirm,
}: ChangePlanConfirmToastMessageComponent) {
  return (
    <>
      <p>
        Deseja mudar o plano de {username} de <strong>{currentPlanName}</strong> para{" "}
        <strong>{planName}</strong>?
      </p>
      <Button
        size="sm"
        onClick={onActionConfirm}
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
