import { IconLike } from "@/components/icons/IconLike"
import {
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import React from "react"
import { ActionSetAccountsLimitMenuSubContent } from "./MenuSubContent"

export type ActionSetAccountsLimitMenuSubTriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuSubTrigger
> & {
  children: React.ReactNode
}

export const ActionSetAccountsLimitMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubTrigger>,
  ActionSetAccountsLimitMenuSubTriggerProps
>(function ActionSetAccountsLimitMenuSubTriggerComponent({ children, className, ...props }, ref) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          {...props}
          className={cn("flex gap-2", className)}
          ref={ref}
        >
          {children}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <ActionSetAccountsLimitMenuSubContent render={() => <IconLike className="size-3 text-white" />} />
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  )
})

ActionSetAccountsLimitMenuSubTrigger.displayName = "ActionSetAccountsLimitMenuSubTrigger"
