import { cssVariables } from "@/util/units/cssVariables"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import * as React from "react"

import { buttonPrimaryHueThemes } from "@/components/theme/button-primary"
import { cn } from "@/lib/utils"
import st from "./accordion.module.css"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
    removeBorderOnClosed?: boolean
  } & (
      | {
          huedBorder?: true
          colorScheme: keyof typeof buttonPrimaryHueThemes
        }
      | {
          huedBorder?: false | undefined
          colorScheme?: never
        }
    )
>(({ style, children, className, removeBorderOnClosed = false, ...props }, ref) => {
  function getStyleHued() {
    if (!props.huedBorder) return style
    const [appleHue, bananaHue] = buttonPrimaryHueThemes[props.colorScheme]
    const hues = Object.entries({ appleHue, bananaHue })
    return cssVariables(hues, style)
  }

  const { huedBorder, colorScheme, ...props1 } = props

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(
        "relative",
        className,
        st.shadowEffect,
        removeBorderOnClosed && "[&[data-state='closed']_i]:hidden"
      )}
      {...props1}
    >
      {children}
      <i
        className={cn("absolute left-0 right-0 top-full h-[1px]")}
        style={getStyleHued()}
      />
    </AccordionPrimitive.Item>
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-left text-lg font-medium transition-all md:text-xl [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-slate-400 transition-all",
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
