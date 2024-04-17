import { HeaderStructure } from "@/components/layouts/Header/header-structure"
import { HeaderUser } from "@/components/layouts/Header/header-user"
import { SheetHeaderNavbar } from "@/components/molecules/sheet-header-navbar"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/contexts/ERROR-BOUNDARY"
import { useUser } from "@/contexts/UserContext"
import { useServerMeta } from "@/contexts/server-meta"
import { cn } from "@/lib/utils"
import Link from "next/link"
import React from "react"

export type HeaderProps = Omit<React.ComponentPropsWithoutRef<typeof HeaderStructure> & {}, "children">

export const Header = React.forwardRef<React.ElementRef<typeof HeaderStructure>, HeaderProps>(
  function HeaderComponent({ className, ...props }, ref) {
    const hasSessionServerMeta = !!useServerMeta()?.session
    const hasSessionQuery = useUser(user => !!user.username)
    const session = hasSessionQuery.status === "pending" ? hasSessionServerMeta : !!hasSessionQuery.data

    const maintance = process.env.NEXT_PUBLIC_MAINTANCE === "true"

    const userIsBanned = useServerMeta()?.session?.status === "BANNED"

    return (
      <HeaderStructure
        {...props}
        className={cn(className)}
        ref={ref}
      >
        <div className="flex flex-1 md:hidden">
          <SheetHeaderNavbar>
            <SVGList className="aspect-square h-7 w-7 cursor-pointer" />
          </SheetHeaderNavbar>
        </div>
        <div className="flex h-full flex-1 justify-center md:justify-start">
          <div className="flex shrink-0 items-center">
            <img
              src="logo.png"
              alt=""
              className="h-[1.7rem]"
            />
          </div>
          <ul className="hidden items-center gap-2 pl-8 md:flex">
            <li className="px-2 text-slate-300 hover:text-white hover:underline">
              <Link
                scroll={false}
                href="#how-it-works"
              >
                Como funciona?
              </Link>
            </li>
            <li className="px-2 text-slate-300 hover:text-white hover:underline">
              <Link
                scroll={false}
                href="#plans"
              >
                Pacotes
              </Link>
            </li>
            <li className="px-2 text-slate-300 hover:text-white hover:underline">
              <Link
                scroll={false}
                href="#faq"
              >
                FAQ
              </Link>
            </li>
            <li className="px-2 text-slate-300 hover:text-white hover:underline">
              <Link
                scroll={false}
                href="#footer"
              >
                Suporte
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex h-full flex-1 justify-end md:flex-initial">
          {!!session ? (
            <div className="flex h-full items-center gap-4">
              <Button
                variant="ghost"
                className={cn(
                  "hidden h-full md:flex",
                  userIsBanned && "pointer-events-none cursor-not-allowed opacity-50"
                )}
                disabled={userIsBanned}
                asChild
              >
                <Link href="/dashboard">Ir para Dashboard</Link>
              </Button>
              <ErrorBoundary>
                <HeaderUser />
              </ErrorBoundary>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                className={cn(
                  "hidden h-full sm:flex",
                  maintance && "pointer-events-none cursor-not-allowed opacity-50"
                )}
                disabled={maintance}
                title={maintance ? "Servidor em manutenção." : undefined}
                asChild
              >
                <Link href="/sign-in">
                  <span>Entrar</span>
                  <SVGUser />
                </Link>
              </Button>
              <Link
                href="/sign-in"
                className="grid place-items-center overflow-hidden sm:hidden"
              >
                <SVGUser className="aspect-square h-7 w-7 scale-[0.925]" />
              </Link>
            </>
          )}
        </div>
      </HeaderStructure>
    )
  }
)

Header.displayName = "Header"

export type SVGUserProps = React.ComponentPropsWithoutRef<"svg">

export function SVGUser({ className, ...props }: SVGUserProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("w-4", className)}
      {...props}
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <line
        x1={24}
        y1={128}
        x2={136}
        y2={128}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <polyline
        points="96 88 136 128 96 168"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <path
        d="M136,40h56a8,8,0,0,1,8,8V208a8,8,0,0,1-8,8H136"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}

export type SVGListProps = React.ComponentPropsWithoutRef<"svg"> & {}

export const SVGList = React.forwardRef<React.ElementRef<"svg">, SVGListProps>(function SVGListComponent(
  { className, ...props },
  ref
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      className={cn("", className)}
      ref={ref}
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <line
        x1={40}
        y1={128}
        x2={216}
        y2={128}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <line
        x1={40}
        y1={64}
        x2={216}
        y2={64}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <line
        x1={40}
        y1={192}
        x2={216}
        y2={192}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
})

SVGList.displayName = "SVGList"

type BannedUserBoundary = {
  children: React.ReactNode
}

export function BannedUserBoundary({ children }: BannedUserBoundary) {
  return <div className="absolute inset-0 bg-red-500">{children}</div>
}
