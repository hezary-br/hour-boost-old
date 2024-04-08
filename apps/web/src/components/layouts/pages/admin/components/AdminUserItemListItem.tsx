import { IconChevron } from "@/components/icons/IconChevron"
import { IconCircleDollar } from "@/components/icons/IconCircleDollar"
import { IconUserCycle } from "@/components/icons/IconUserCycle"
import { IconUserX } from "@/components/icons/IconUserX"
import { BadgePlanType } from "@/components/layouts/UserPlanStatus/components"
import { AccordionContent, AccordionItem } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { ECacheKeys } from "@/mutations/queryKeys"
import { getPlanName } from "@/util/getPlanName"
import { getRoleName } from "@/util/getUserRoleName"
import { AccordionTrigger } from "@radix-ui/react-accordion"
import { atom, useAtomValue } from "jotai"
import React, { CSSProperties, useMemo } from "react"
import { VariantProps, tv } from "tailwind-variants"
import { AlertDialogBanUser } from "../BanUser/components/alert-dialog"
import { AlertDialogUnbanUser } from "../UnbanUser/components/alert-dialog"
import { isMutationPending } from "../UserItemAction/ActionSetGamesLimit/components/MenuSubContent"
import { UserItemActionMenuDropdown } from "../UserItemAction/MenuDropdown"
import { UserAdminIdProvider, useUserAdminItemId } from "../UserItemAction/context"
import { ModalSeeUserPurchases } from "../UserPurchases"
import { useUserAdminListItem } from "../hooks/useUserAdminListItem"
import { AdminUserItemProfilePicture } from "./AdminUserItemProfilePicture"
import { filterInputAtom } from "./AdminUserListContent"
import { SteamAccountAdminList } from "./SteamAccountAdminList"

export type UserAdminItemListItemProps = {
  userId: string
}

export function UserAdminItemListItem({ userId }: UserAdminItemListItemProps) {
  const username = useUserAdminListItem(userId, user => user.username)
  const planCustom = useUserAdminListItem(userId, user => user.plan.custom)
  const planNameDomain = useUserAdminListItem(userId, user => user.plan.name)
  const status = useUserAdminListItem(userId, user => user.status)
  const typedThisUsernameAtom = useMemo(
    () => atom(get => get(filterInputAtom).length > 0 && !username.includes(get(filterInputAtom))),
    [filterInputAtom]
  )
  const shouldHide = useAtomValue(typedThisUsernameAtom)
  const isBanned = React.useMemo(() => status === "BANNED", [status])

  const planName = getPlanName(planNameDomain, planCustom)

  return (
    <UserAdminIdProvider userId={userId}>
      <AccordionItem
        removeBorderOnClosed
        value={userId}
        className={shouldHide ? "hidden" : "block"}
      >
        <div className="flex h-[--user-item-height] cursor-pointer items-center [--user-item-height:4.2rem] hover:bg-slate-900/50">
          <AdminUserItemProfilePicture />
          <div className="flex w-[13rem] shrink-0 flex-col pl-4">
            <AdminUserItemUsername />
            <AdminUserItemRole />
          </div>
          <div className="px-4">
            <div className="flex w-20 justify-center whitespace-nowrap">
              <BadgePlanType
                size="sm"
                name={planNameDomain}
              >
                {planName}
              </BadgePlanType>
            </div>
          </div>
          <div className="grid h-full place-items-center pl-4">
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
          <AccordionTrigger className="h-full w-full" />
          <div className="ml-auto flex h-full">
            <div className="flex h-full">
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
          </div>
        </div>
        <AccordionContent
          className="relative border-b border-slate-900 pb-2"
          style={
            {
              "--container-height": "2.75rem",
              "--sa-padding-left": "2rem",
              "--sa-profile-pic-size": "10rem",
              "--sa-name-width": "10rem",
              "--sa-farm-since-width": "9rem",
              "--sa-farmed-time-width": "9rem",
              "--sa-games-width": "10rem",
            } as CSSProperties
          }
        >
          <SteamAccountAdminList />
        </AccordionContent>
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

export const AdminUserItemListItemRoleVariants = tv({
  base: "px-1 py-[0.1875rem] text-2xs/none border font-medium grid place-items-center w-fit rounded-sm",
  variants: {
    role: {
      USER: "border-slate-800 bg-slate-900 text-slate-500",
      ADMIN: "border-green-500 bg-green-400/40 text-green-300",
    },
  },
})

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
