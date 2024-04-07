import { UserAdminItemList } from "@/components/layouts/pages/admin/components/AdminUserItemList"
import { ApplicationStatus } from "@/components/layouts/pages/admin/components/ApplicationStatus"
import { FilterAdminPanelInput } from "@/components/layouts/pages/admin/components/FilterAdminPanelInput"
import { cn } from "@/lib/utils"
import { atom } from "jotai"
import React, { useTransition } from "react"

export type AdminUserListContentProps = React.ComponentPropsWithoutRef<"div"> & {}

export const filterInputAtom = atom("")

export const AdminUserListContent = React.forwardRef<React.ElementRef<"div">, AdminUserListContentProps>(
  function AdminUserListContentComponent({ className, ...props }, ref) {
    const [isPending, startTransition] = useTransition()

    return (
      <div
        {...props}
        className={cn("mt-8", className)}
        ref={ref}
      >
        <div className="flex items-center justify-between">
          <ApplicationStatus />
          <FilterAdminPanelInput startTransition={startTransition} />
        </div>
        <UserAdminItemList isPending={isPending} />
      </div>
    )
  }
)

AdminUserListContent.displayName = "AdminUserListContent"
