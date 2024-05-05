import { CardPlan as CP, ContextCardPlanRoot, UserPlanContext } from "@/components/cards/CardPlan"
import { cn } from "@/lib/utils"
import React, { useContext } from "react"

export type ButtonPreapprovalActionProps = React.ComponentPropsWithoutRef<typeof CP.Button>

export const ButtonPreapprovalAction = React.forwardRef<React.ElementRef<typeof CP.Button>, ButtonPreapprovalActionProps>(
  function ButtonPreapprovalActionComponent({ className, ...props }, ref) {
    const userPlan = useContext(UserPlanContext)
    const cardRoot = useContext(ContextCardPlanRoot)

    return (
      <CP.Button
        ref={ref}
        disabled={userPlan?.planName === cardRoot?.planName}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
