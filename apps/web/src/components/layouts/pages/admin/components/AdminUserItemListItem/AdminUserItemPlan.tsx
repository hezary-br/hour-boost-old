import { BadgePlanType } from "@/components/layouts/UserPlanStatus/components"
import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { cn } from "@/lib/utils"
import { getPlanNameCheckIfCustom } from "@/util/getPlanName"
import React from "react"

import { ChangeUserPlanMenuDropdown } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/actions/change-user-plan"

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
          <ChangeUserPlanMenuDropdown>
            <BadgePlanType
              size="sm"
              name={planNameDomain}
            >
              {planName}
            </BadgePlanType>
          </ChangeUserPlanMenuDropdown>
        </div>
      </div>
    )
  }
)
