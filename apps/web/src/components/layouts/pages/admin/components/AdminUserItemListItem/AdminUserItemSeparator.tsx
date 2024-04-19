import { AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import React from "react"

export type AdminUserItemSeparatorProps = React.ComponentPropsWithoutRef<typeof AccordionTrigger>

export const AdminUserItemSeparator = React.forwardRef<
  React.ElementRef<typeof AccordionTrigger>,
  AdminUserItemSeparatorProps
>(function AdminUserItemSeparatorComponent({ className, ...props }, ref) {
  return (
    <AccordionTrigger
      {...props}
      className={cn("", className)}
    />
  )
})
