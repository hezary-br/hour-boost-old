import { HeaderStructure } from "@/components/layouts/Header/header-structure"
import { HeaderUser } from "@/components/layouts/Header/header-user"
import { useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { RoleName } from "core"
import React from "react"

export type HeaderDashboardProps = Omit<React.ComponentPropsWithoutRef<typeof HeaderStructure>, "children">

export const HeaderDashboard = React.forwardRef<
  React.ElementRef<typeof HeaderStructure>,
  HeaderDashboardProps
>(function HeaderDashboardComponent({ className, ...props }, ref) {
  return (
    <HeaderStructure
      {...props}
      className={cn("gap-8", className)}
      ref={ref}
    >
      <div className="flex h-full flex-1 items-center gap-4">
        <div className="flex shrink-0 items-center">
          <img
            src="logo.png"
            alt=""
            className="h-[1.7rem]"
          />
        </div>
      </div>
      <div className="flex h-full flex-1 items-center justify-end gap-4">
        <div className="hidden sm:flex">
          <Username />
        </div>
        <HeaderUser />
      </div>
    </HeaderStructure>
  )
})

export type RoleBadgeProps = React.ComponentPropsWithoutRef<"div"> & {
  role: RoleName
}

export const RoleBadge = React.forwardRef<React.ElementRef<"div">, RoleBadgeProps>(
  function RoleBadgeComponent({ role, className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn("flex items-center gap-2 text-sm", className)}
        ref={ref}
      >
        <span className="font-semibold">Cargo:</span>
        <span
          className={cn("rounded-md bg-indigo-600 px-2 py-1 leading-none", {
            "bg-lime-500/90": role === "ADMIN",
          })}
        >
          {role}
        </span>
      </div>
    )
  }
)

RoleBadge.displayName = "RoleBadge"

HeaderDashboard.displayName = "HeaderDashboard"

export type UsernameProps = React.ComponentPropsWithoutRef<"span">

export const Username = React.forwardRef<React.ElementRef<"span">, UsernameProps>(function UsernameComponent(
  { className, ...props },
  ref
) {
  const username = useUser(user => user.username)
  if (username.status !== "success")
    return <div className="h-5 w-[6rem] animate-pulse rounded bg-slate-800" />

  return (
    <span
      ref={ref}
      className={cn("text-sm font-medium text-white", className)}
      {...props}
    >
      {username.data}
    </span>
  )
})
