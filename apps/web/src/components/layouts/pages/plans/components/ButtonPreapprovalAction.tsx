import { CardPlan as CP, ContextCardPlanRoot, UserPlanContext } from "@/components/cards/CardPlan"
import { usePreApprovalPlan } from "@/components/layouts/pages/plans/preapproval-plan/mutation"
import { buttonPrimaryHueThemes, generateColorSchema } from "@/components/theme/button-primary"
import { useServerMeta } from "@/contexts/server-meta"
import { cn } from "@/lib/utils"
import { useClerk } from '@clerk/clerk-react'
import { useRouter } from "next/router"
import React, { useContext } from "react"

export type ButtonPreapprovalActionProps = React.ComponentPropsWithoutRef<typeof CP.Button> & {
  colorScheme?: keyof typeof buttonPrimaryHueThemes
  dontGoBackAtThisPage?: boolean
}

export const ButtonPreapprovalAction = React.forwardRef<React.ElementRef<typeof CP.Button>, ButtonPreapprovalActionProps>(
  function ButtonPreapprovalActionComponent({ dontGoBackAtThisPage, style, colorScheme, children, className, ...props }, ref) {
    const cs = generateColorSchema(colorScheme)
    const userPlan = useContext(UserPlanContext)
    const cardRoot = useContext(ContextCardPlanRoot)
    if (!cardRoot) throw new Error("Card root not provided.")
    const serverMeta = useServerMeta()
    const userId = serverMeta?.session?.userId
    const planName = serverMeta?.session?.planName
    const router = useRouter()
    const clerk = useClerk()
    const preApprovalPlan = usePreApprovalPlan({ userId })
    const { plan_interested } = router.query

    const interestedInThisPlan = plan_interested === cardRoot.planName && "animate-ping"
    const shouldPing = interestedInThisPlan && planName !== cardRoot.planName

    const actionClick = () => {
      if (!userId) {
        return clerk.redirectToSignIn(dontGoBackAtThisPage ? undefined : {
          afterSignInUrl: `/plans?plan_interested=${cardRoot.planName}`
        })
      }
      preApprovalPlan.mutate({
        planName: cardRoot.planName,
        userId,
      }, {
        onSuccess: console.log,
        onError: console.log,
      })
    }

    return (
      <>
        <div className="relative div">
          {shouldPing && (
            <span className="top-0.5 bottom-0.5 left-2.5 right-2.5 absolute bg-white/30 animate-ping" />
          )}
          <CP.Button
            ref={ref}
            onClick={actionClick}
            disabled={userPlan?.planName === cardRoot.planName}
            className={cn("relative z-10", cs?.className, className)}
            style={{ ...style, ...cs?.style }}
            {...props}
          >
            <span className="relative z-30">{children}</span>
          </CP.Button>
        </div>
      </>
    )
  }
)
