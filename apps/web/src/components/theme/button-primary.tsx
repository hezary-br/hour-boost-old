import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cssVariables } from "@/util/units/cssVariables"
import React from "react"
import st from "./button-primary.module.css"

export type ButtonPrimaryProps = React.ComponentPropsWithoutRef<typeof Button> & {
  colorScheme?: keyof typeof buttonPrimaryHueThemes
  children: React.ReactNode
}

export const buttonPrimaryHueThemes = {
  get default(): string[] {
    return this["cyan-blue"]
  },
  "cyan-blue": [228, 193],
  "orange-yellow": [57, 30],
  "purple-blue": [240, 300],
} as const

export const backgroundHueThemes = {
  get default(): string[] {
    return this["black-shadow"]
  },
  "black-shadow": ["#000", "#2b2b2b"],
  "white-shadow": ["#fff", "#aaa"],
} as const

export const ButtonPrimary = React.forwardRef<React.ElementRef<typeof Button>, ButtonPrimaryProps>(
  function ButtonPrimaryComponent({ colorScheme = "default", style, children, className, ...props }, ref) {
    const cs = generateColorSchema(colorScheme)

    return (
      <Button
        {...props}
        className={cn("px-5 py-0 font-semibold text-white", cs?.className, className)}
        ref={ref}
        style={{ ...style, ...cs?.style }}
      >
        {children}
      </Button>
    )
  }
)

ButtonPrimary.displayName = "ButtonPrimary"

export function generateColorSchema(colorScheme?: keyof typeof buttonPrimaryHueThemes) {
  if (!colorScheme) return
  const [appleHue, bananaHue] = buttonPrimaryHueThemes[colorScheme]
  const hues = Object.entries({ appleHue, bananaHue })

  return {
    style: cssVariables(hues),
    className: st.buttonStyles
  }
}
