import { IconCircleDollar } from "@/components/icons/IconCircleDollar"
import { IconUserX } from "@/components/icons/IconUserX"
import { AlertDialogBanUser } from "@/components/layouts/pages/admin/BanUser/components/alert-dialog"
import { AlertDialogUnbanUser } from "@/components/layouts/pages/admin/UnbanUser/components/alert-dialog"
import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { ModalSeeUserPurchases } from "@/components/layouts/pages/admin/UserPurchases"
import { IconUnbanning } from "@/components/layouts/pages/admin/components/AdminUserItemListItem"
import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { cn } from "@/lib/utils"
import React from "react"

export type AdminUserItemManageUserProps = React.ComponentPropsWithoutRef<"div">

export const AdminUserItemManageUser = React.forwardRef<
  React.ElementRef<"div">,
  AdminUserItemManageUserProps
>(function AdminUserItemManageUserComponent({ className, ...props }, ref) {
  const userId = useUserAdminItemId()
  const status = useUserAdminListItem(userId, user => user.status)
  const isBanned = React.useMemo(() => status === "BANNED", [status])

  return (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    >
      <ModalSeeUserPurchases>
        <button className="flex h-full w-[3.5rem] items-center justify-center gap-2 px-4 text-sm hover:bg-slate-800/50">
          <IconCircleDollar className="size-5" />
        </button>
      </ModalSeeUserPurchases>
      {!isBanned && (
        <AlertDialogBanUser>
          <button className="flex h-full w-[3.5rem] items-center justify-center gap-2 px-4 text-sm hover:bg-slate-800/50">
            <IconUserX className="size-5" />
          </button>
        </AlertDialogBanUser>
      )}
      {isBanned && (
        <AlertDialogUnbanUser>
          <button className="flex h-full w-[3.5rem] items-center justify-center gap-2 px-4 text-sm hover:bg-slate-800/50">
            <IconUnbanning />
          </button>
        </AlertDialogUnbanUser>
      )}
      {/* <button className="flex items-center gap-2 h-full px-4 text-sm hover:bg-slate-800/50">
                  <IconUserMinus className="size-5" />
                </button> */}
    </div>
  )
})
