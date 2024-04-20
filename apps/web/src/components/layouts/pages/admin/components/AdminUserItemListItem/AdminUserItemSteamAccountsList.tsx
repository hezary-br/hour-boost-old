import { AccordionContent } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import React, { CSSProperties } from "react"

export type AdminUserItemSteamAccountsListProps = React.ComponentPropsWithoutRef<typeof AccordionContent>

export const AdminUserItemSteamAccountsList = React.forwardRef<
  React.ElementRef<typeof AccordionContent>,
  AdminUserItemSteamAccountsListProps
>(function AdminUserItemSteamAccountsListComponent({ children, className, ...props }, ref) {
  return (
    <AccordionContent
      ref={ref}
      className={cn("relative border-b border-slate-900 pb-2", className)}
      {...props}
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
      {children}
    </AccordionContent>
  )
})
