import { CardPlan as CP } from "@/components/cards/CardPlan"
import { IconSpinner } from "@/components/icons"
import { useButtonPreapprovalAction } from "@/components/layouts/pages/plans/components/ButtonPreapprovalAction.controller"
import { buttonPrimaryHueThemes, generateColorSchema } from "@/components/theme/button-primary"
import { cn } from "@/lib/utils"
import React from "react"
import twc from "tailwindcss/colors"

export type ButtonPreapprovalActionProps = React.ComponentPropsWithoutRef<typeof CP.Button> & {
  colorScheme?: keyof typeof buttonPrimaryHueThemes
  dontGoBackAtThisPage?: boolean
}

export const ButtonPreapprovalAction = React.forwardRef<
  React.ElementRef<typeof CP.Button>,
  ButtonPreapprovalActionProps
>(function ButtonPreapprovalActionComponent({ children, ...controllerProps }, ref) {
  const { style, colorScheme, className, dontGoBackAtThisPage, ...props } = controllerProps
  const controller = useButtonPreapprovalAction(controllerProps)
  const cs = generateColorSchema(colorScheme)

  return (
    <>
      <div className="div relative">
        {controller.shouldPing && (
          <span className="absolute bottom-0.5 left-2.5 right-2.5 top-0.5 animate-ping bg-white/30" />
        )}
        <CP.Button
          ref={ref}
          onMouseDown={controller.actionClick}
          aria-busy={controller.pending}
          disabled={controller.disabled}
          className={cn("relative z-10", cs?.className, className)}
          style={{ ...style, ...cs?.style }}
          {...props}
        >
          <span className="relative z-30">{children}</span>
          {controller.pendingHard && (
            <div className="-scale-x-100">
              <IconSpinner
                color={cs ? twc.slate["500"] : undefined}
                className="animate-spin-r size-6 fill-white text-white"
              />
            </div>
          )}
        </CP.Button>
      </div>
    </>
  )
})
