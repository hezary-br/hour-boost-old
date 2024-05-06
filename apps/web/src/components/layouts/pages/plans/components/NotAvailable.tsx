import { UserPlanContext } from "@/components/cards/CardPlan"
import { cn } from "@/lib/utils"
import React, { useContext } from "react"

export type NotAvailableProps = React.ComponentPropsWithoutRef<"div">

export const NotAvailable = React.forwardRef<React.ElementRef<"div">, NotAvailableProps>(
  function NotAvailableComponent({ className, ...props }, ref) {
    const userPlan = useContext(UserPlanContext)
    const isGuest = userPlan?.planName === undefined
    const allowToBuyThisPlan = isGuest

    if (allowToBuyThisPlan) return null

    return (
      <div
        ref={ref}
        className={cn("absolute inset-0 z-[25] cursor-not-allowed bg-black/40", className)}
        {...props}
      />
    )
  }
)
