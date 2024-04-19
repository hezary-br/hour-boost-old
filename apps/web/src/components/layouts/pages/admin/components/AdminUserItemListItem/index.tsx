import { IconUserCycle } from "@/components/icons/IconUserCycle"
import { AdminUserItemActions } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/AdminUserItemActions"
import { AdminUserItemManageUser } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/AdminUserItemManageUser"
import { AdminUserItemPlan } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/AdminUserItemPlan"
import { AdminUserItemSeparator } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/AdminUserItemSeparator"
import { AdminUserItemSteamAccountsList } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/AdminUserItemSteamAccountsList"
import { AdminUserItemUserInfo } from "@/components/layouts/pages/admin/components/AdminUserItemListItem/AdminUserItemUserInfo"
import { AccordionItem } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { ECacheKeys } from "@/mutations/queryKeys"
import { atom, useAtomValue } from "jotai"
import React, { useMemo } from "react"
import { tv } from "tailwind-variants"
import { isMutationPending } from "../../UserItemAction/ActionSetGamesLimit/components/MenuSubContent"
import { UserAdminIdProvider, useUserAdminItemId } from "../../UserItemAction/context"
import { useUserAdminListItem } from "../../hooks/useUserAdminListItem"
import { AdminUserItemProfilePicture } from "../AdminUserItemProfilePicture"
import { filterInputAtom } from "../AdminUserListContent"
import { SteamAccountAdminList } from "../SteamAccountAdminList"

export type UserAdminItemListItemProps = {
  userId: string
}

export function UserAdminItemListItem({ userId }: UserAdminItemListItemProps) {
  const username = useUserAdminListItem(userId, user => user.username)
  const planCustom = useUserAdminListItem(userId, user => user.plan.custom)
  const planNameDomain = useUserAdminListItem(userId, user => user.plan.name)
  const typedThisUsernameAtom = useMemo(
    () => atom(get => get(filterInputAtom).length > 0 && !username.includes(get(filterInputAtom))),
    [filterInputAtom]
  )
  const shouldHide = useAtomValue(typedThisUsernameAtom)

  return (
    <UserAdminIdProvider userId={userId}>
      <AccordionItem
        removeBorderOnClosed
        value={userId}
        className={shouldHide ? "hidden" : "block"}
      >
        <div className="flex h-[--user-item-height] cursor-pointer items-center [--user-item-height:4.2rem] hover:bg-slate-900/50">
          <AdminUserItemProfilePicture />
          <AdminUserItemUserInfo className="flex w-[13rem] shrink-0 flex-col pl-4" />
          <AdminUserItemPlan className="px-4" />
          <AdminUserItemActions className="h-full pl-4" />
          <AdminUserItemSeparator className="h-full w-full" />
          <AdminUserItemManageUser className="ml-auto flex h-full" />
        </div>
        <AdminUserItemSteamAccountsList>
          <SteamAccountAdminList />
        </AdminUserItemSteamAccountsList>
      </AccordionItem>
    </UserAdminIdProvider>
  )
}

UserAdminItemListItem.displayName = "UserAdminItemListItem"

export type IconUnbanningProps = React.ComponentPropsWithoutRef<typeof IconUserCycle> & {}

export const IconUnbanning: React.FC<IconUnbanningProps> = ({ className, ...props }) => {
  const userId = useUserAdminItemId()
  const isUnbanningUser = isMutationPending(ECacheKeys.unbanUser(userId))

  return (
    <IconUserCycle
      {...props}
      className={cn("size-6 text-emerald-300", isUnbanningUser && "animate-spin", className)}
    />
  )
}

export const AdminUserItemListItemRoleVariants = tv({
  base: "px-1 py-[0.1875rem] text-2xs/none border font-medium grid place-items-center w-fit rounded-sm",
  variants: {
    role: {
      USER: "border-slate-800 bg-slate-900 text-slate-500",
      ADMIN: "border-green-500 bg-green-400/40 text-green-300",
    },
  },
})
