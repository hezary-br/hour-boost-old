import { IconChevron } from "@/components/icons/IconChevron"
import { UserItemActionMenuDropdown } from "@/components/layouts/pages/admin/UserItemAction/MenuDropdown"
import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { cn } from "@/lib/utils"
import React from "react"

export type AdminUserItemActionsProps = React.ComponentPropsWithoutRef<"div">

export const AdminUserItemActions = React.forwardRef<React.ElementRef<"div">, AdminUserItemActionsProps>(
  function AdminUserItemActionsComponent({ className, ...props }, ref) {
    const userId = useUserAdminItemId()
    const status = useUserAdminListItem(userId, user => user.status)

    const isBanned = React.useMemo(() => status === "BANNED", [status])

    return (
      <div
        ref={ref}
        className={cn("grid place-items-center ", className)}
        {...props}
      >
        <UserItemActionMenuDropdown preventDefault={isBanned}>
          <button
            disabled={isBanned}
            className="flex h-full items-center gap-2 pl-8 pr-6 hover:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>Ações</span>
            <IconChevron className="size-3" />
          </button>
        </UserItemActionMenuDropdown>
      </div>
    )
  }
)
