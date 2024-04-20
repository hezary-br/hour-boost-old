import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { AdminUserItemListItemRoleVariants } from "@/components/layouts/pages/admin/components/AdminUserItemListItem"
import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { cn } from "@/lib/utils"
import { getRoleName } from "@/util/getUserRoleName"
import { VariantProps } from "class-variance-authority"
import React from "react"

export type AdminUserItemUserInfoProps = React.ComponentPropsWithoutRef<"div">

export const AdminUserItemUserInfo = React.forwardRef<React.ElementRef<"div">, AdminUserItemUserInfoProps>(
  function AdminUserItemUserInfoComponent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        <AdminUserItemUsername />
        <AdminUserItemRole />
      </div>
    )
  }
)

export type AdminUserItemUsernameProps = React.ComponentPropsWithoutRef<"strong"> & {}

export const AdminUserItemUsername = React.forwardRef<React.ElementRef<"strong">, AdminUserItemUsernameProps>(
  function AdminUserItemUsernameComponent({ className, ...props }, ref) {
    const userId = useUserAdminItemId()
    const username = useUserAdminListItem(userId, user => user.username)
    const status = useUserAdminListItem(userId, user => user.status)
    const isBanned = React.useMemo(() => status === "BANNED", [status])

    return (
      <strong
        {...props}
        className={cn("text-lg font-medium", isBanned && "text-slate-500")}
        ref={ref}
      >
        {username}
      </strong>
    )
  }
)

AdminUserItemUsername.displayName = "AdminUserItemUsername"

export type AdminUserItemRoleProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof AdminUserItemListItemRoleVariants> & {}

export const AdminUserItemRole = React.forwardRef<React.ElementRef<"span">, AdminUserItemRoleProps>(
  function AdminUserItemRoleComponent({ className, ...props }, ref) {
    const userId = useUserAdminItemId()
    const role = useUserAdminListItem(userId, user => user.role)

    return (
      <span
        {...props}
        className={AdminUserItemListItemRoleVariants({ role, className })}
        ref={ref}
      >
        {getRoleName(role)}
      </span>
    )
  }
)

AdminUserItemRole.displayName = "AdminUserItemRole"
