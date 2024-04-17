import { IconChevron } from "@/components/icons/IconChevron"
import { MenuDropdownUserHeader } from "@/components/molecules/menu-dropdown-user-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/contexts/UserContext"
import { useServerMeta } from "@/contexts/server-meta"
import { cn } from "@/lib/utils"
import { getUserInitials } from "@/util/getUserInitials"
import Image from "next/image"
import React from "react"

export type HeaderUserProps = Omit<React.ComponentPropsWithoutRef<typeof MenuDropdownUserHeader>, "children">

export const HeaderUser = React.forwardRef<React.ElementRef<typeof MenuDropdownUserHeader>, HeaderUserProps>(
  function HeaderUserComponent({ className, ...props }, ref) {
    const userIsBanned = useServerMeta()?.session?.status === "BANNED"

    return (
      <MenuDropdownUserHeader
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        <button
          disabled={userIsBanned}
          className={cn(
            "flex h-9 cursor-pointer items-center rounded-sm px-1 hover:bg-slate-800 focus-visible:outline-none",
            userIsBanned && "pointer-events-none cursor-not-allowed opacity-50"
          )}
        >
          <Avatar
            ref={ref}
            {...props}
            className={cn("h-7 w-7 rounded-sm", className)}
          >
            <ProfilePic />
          </Avatar>
          <div className="ml-0.5 flex items-center justify-center">
            <IconChevron className="size-3.5 text-slate-400" />
          </div>
        </button>
      </MenuDropdownUserHeader>
    )
  }
)

export type ProfilePicProps = React.ComponentPropsWithoutRef<typeof Avatar>

export const ProfilePic = React.forwardRef<React.ElementRef<typeof Avatar>, ProfilePicProps>(
  function ProfilePicComponent({ className, ...props }, ref) {
    const profilePic = useUser(user => user.profilePic)
    const username = useUser(user => user.username)

    if (
      !profilePic.data ||
      !username.data ||
      profilePic.status !== "success" ||
      username.status !== "success"
    ) {
      return <div className="absolute inset-0 animate-pulse bg-slate-800" />
    }

    const userInitials = getUserInitials(username.data)
    return (
      <>
        <Image
          priority
          src={profilePic.data}
          alt="user profile picture"
          fill
        />
        {/* <AvatarImage src={profilePic.data} /> */}
        <AvatarFallback>{userInitials}</AvatarFallback>
      </>
    )
  }
)
