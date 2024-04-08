import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { useClerk } from "@clerk/clerk-react"
import Link from "next/link"
import { useRouter } from "next/router"
import React from "react"

export type MenuDropdownUserHeaderProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent> & {
  children: React.ReactNode
}

export const MenuDropdownUserHeader = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  MenuDropdownUserHeaderProps
>(function MenuDropdownUserHeaderComponent({ children, className, ...props }, ref) {
  const isAdminQuery = useUser(user => user.role === "ADMIN")
  const isAdmin = !!isAdminQuery.data

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        {...props}
        className={cn("", className)}
        ref={ref}
        align="end"
      >
        <HeaderLink to="/home">Home</HeaderLink>
        <HeaderLink to="/dashboard">Dashboard</HeaderLink>
        {isAdmin && (
          <>
            <HeaderLink to="/admin">Painel Admin</HeaderLink>
          </>
        )}
        <DropdownMenuItemLogout>Sair</DropdownMenuItemLogout>
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
