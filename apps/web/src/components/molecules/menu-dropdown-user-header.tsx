import { CancelPlanModal } from "@/use-cases/cancel-plan/components/modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/contexts/UserContext"
import { useServerMeta } from "@/contexts/server-meta"
import { cn } from "@/lib/utils"
import { useClerk } from "@clerk/clerk-react"
import Link from "next/link"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"

export type MenuDropdownUserHeaderProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent> & {
  children: React.ReactNode
}

export const MenuDropdownUserHeader = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  MenuDropdownUserHeaderProps
>(function MenuDropdownUserHeaderComponent({ children, className, ...props }, ref) {
  const isAdminServerMeta = useServerMeta()?.session?.role === "ADMIN"
  const isAdminQuery = useUser(user => user.role === "ADMIN")
  const isAdmin = isAdminQuery.status === "pending" ? isAdminServerMeta : !!isAdminQuery.data

  const userIsBanned = useServerMeta()?.session?.status === "BANNED"
  const router = useRouter()
  useEffect(() => void console.log(router), [router])

  const [transiting, setTransiting] = useState(false)

  useEffect(() => {
    const handleStart = url => url !== router.asPath && setTransiting(true)
    const handleComplete = url => url === router.asPath && setTransiting(false)

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleComplete)
    router.events.on("routeChangeError", handleComplete)

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleComplete)
      router.events.off("routeChangeError", handleComplete)
    }
  })
  // userIsBanned && "pointer-events-none cursor-not-allowed opacity-50"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        {...props}
        className={cn("relative", className)}
        ref={ref}
        align="end"
      >
        {transiting && <div className="pointer-events-none absolute inset-0 z-30 bg-black/40" />}
        {userIsBanned ? (
          <DropdownMenuItemLogout>Sair</DropdownMenuItemLogout>
        ) : (
          <>
            <HeaderLink to="/home">Home</HeaderLink>
            <HeaderLink to="/dashboard">Dashboard</HeaderLink>
            <HeaderLink to="/plans">Mudar plano</HeaderLink>
            <CancelPlanModal>
              <HeaderButton>Cancelar plano</HeaderButton>
            </CancelPlanModal>
            {isAdmin && (
              <>
                <HeaderLink to="/admin">Painel Admin</HeaderLink>
              </>
            )}
            <DropdownMenuItemLogout>Sair</DropdownMenuItemLogout>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

MenuDropdownUserHeader.displayName = "MenuDropdownUserHeader"

export type DropdownMenuItemUserDashboardProps = {
  children?: React.ReactNode | null
  to: string
}

export type DropdownMenuItemLogoutProps = React.ComponentPropsWithoutRef<typeof DropdownMenuItem>

export const DropdownMenuItemLogout = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  DropdownMenuItemLogoutProps
>(function DropdownMenuItemLogoutComponent({ children, onClick, className, ...props }, ref) {
  const { signOut } = useClerk()
  const router = useRouter()

  return (
    <DropdownMenuItem
      ref={ref}
      className={cn("focus:bg-red-500", className)}
      onClick={async e => {
        await signOut()
        // GAMBIARRA, REDIRECT DO CLERK DEVERIA FAZER ISSO NO MIDDLEWARE
        document.cookie = "hb-identification=; Max-Age=0"
        document.cookie = "hb-has-user=; Max-Age=0"
        document.cookie = "hb-has-id=false; Path=/"
        router.reload()
        onClick && onClick(e)
      }}
    >
      {children}
    </DropdownMenuItem>
  )
})

export type HeaderLinkProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
  to: string
}

export const HeaderLink = React.forwardRef<React.ElementRef<typeof Link>, HeaderLinkProps>(
  function HeaderLinkComponent({ to, className, ...props }, ref) {
    const router = useRouter()
    if (router.pathname === to) return null

    return (
      <Link
        ref={ref}
        className={cn(
          "hover:bg-accent relative flex cursor-default select-none items-center px-2 py-1.5 text-sm outline-none transition-colors transition-none hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        href={to}
        {...props}
      />
    )
  }
)

export type HeaderButtonProps = React.ComponentPropsWithoutRef<"button">

export const HeaderButton = React.forwardRef<React.ElementRef<"button">, HeaderButtonProps>(
  function HeaderButtonComponent({ className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "hover:bg-accent relative flex w-full cursor-default select-none items-center px-2 py-1.5 text-sm outline-none transition-colors transition-none hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
