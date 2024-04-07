import { HeaderUser } from "@/components/layouts/Header/header-user"
import { SheetHeaderNavbar } from "@/components/molecules/sheet-header-navbar"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/contexts/ERROR-BOUNDARY"
import { cn } from "@/lib/utils"
import { getUserInitials } from "@/util/getUserInitials"
import Link from "next/link"
import React from "react"

export type HeaderProps = React.ComponentPropsWithoutRef<"header"> & {}

export const Header = React.forwardRef<React.ElementRef<"header">, HeaderProps>(function HeaderComponent(
  { className, ...props },
  ref
) {
  const user = { username: "vm", profilePic: "" }
  const userInitials = getUserInitials(user?.username)

  return (
    <header
      {...props}
      className={cn(
        "relative z-40 flex h-14 items-center border-b border-white/10 bg-black/30 backdrop-blur-sm",
        className
      )}
      ref={ref}
    >
      {/* <pre className="absolute top-5 left-5 bg-orange-100 text-orange-500 p-2 text-xs">
        {JSON.stringify({ user: user ?? "user is nullish" }, null, 2)}
      </pre> */}
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4">
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
          {user && (
            <div className="flex h-full items-center gap-4">
              <Button
                variant="ghost"
                className="hidden h-full md:flex"
                asChild
              >
                <Link href="/dashboard">Ir para Dashboard</Link>
              </Button>
              <ErrorBoundary>
                <HeaderUser />
              </ErrorBoundary>
            </div>
          )}
          {!user && (
            <>
              <Button
                variant="ghost"
                className="hidden h-full sm:flex"
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
      </div>
    </header>
  )
})

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
