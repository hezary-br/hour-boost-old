import { cn } from "@/lib/utils"
import React, { useMemo } from "react"
import { useUserAdminItemId } from "../UserItemAction/context"
import { useUserAdminListItem } from "../hooks/useUserAdminListItem"

export type AdminUserItemProfilePictureProps = React.ComponentPropsWithoutRef<"div"> & {}

export const AdminUserItemProfilePicture = React.forwardRef<
  React.ElementRef<"div">,
  AdminUserItemProfilePictureProps
>(function AdminUserItemProfilePictureComponent({ className, ...props }, ref) {
  const userId = useUserAdminItemId()
  const profilePicture = useUserAdminListItem(userId, user => user.profilePicture)
  const status = useUserAdminListItem(userId, user => user.status)
  const isBanned = useMemo(() => status === "BANNED", [status])

  return (
    <div
      {...props}
      className={cn("grid size-[--user-item-height] place-items-center", className)}
      ref={ref}
    >
      <div className="relative grid size-[calc(var(--user-item-height)_-_0.25rem)] place-items-center">
        <div className="relative size-[calc(var(--user-item-height)_-_0.5rem)] overflow-hidden rounded shadow-lg shadow-black/50">
          <img
            src={profilePicture}
            // alt={`${user.username}'s profile picture.`}
            className={cn("absolute inset-0 h-full w-full", isBanned && "opacity-50")}
          />
          <div className="inset-0 bg-black" />
        </div>
        {isBanned && (
          <span className="text-2xs absolute left-0 top-0 z-30 flex h-4 -translate-x-2 -translate-y-1/2 items-center bg-red-500 px-1">
            banido
          </span>
        )}
      </div>
    </div>
  )
})

AdminUserItemProfilePicture.displayName = "AdminUserItemProfilePicture"
