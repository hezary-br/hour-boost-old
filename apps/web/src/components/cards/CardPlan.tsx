import { buttonPrimaryHueThemes } from "@/components/theme/button-primary"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cssVariables } from "@/util/units/cssVariables"
import { Slot } from "@radix-ui/react-slot"
import { PlanAllNames } from "core"
import React, { CSSProperties, createContext, useContext } from "react"
import st from "./CardPlan.module.css"
import twc from "tailwindcss/colors"

export type IUserPlanContext = {
  planName?: PlanAllNames
}

export const UserPlanContext = createContext<IUserPlanContext | null>(null)

export type CardPlanProps = React.ComponentPropsWithoutRef<typeof CardPlanRoot> & {
  children: React.ReactNode
}

export const CardPlanX = React.forwardRef<React.ElementRef<typeof CardPlanRoot>, CardPlanProps>(
  function CardPlanComponent({ children, className, ...props }, ref) {
    return (
      <CardPlan.Root
        {...props}
        ref={ref}
      >
        {/* <CardPlan.BackgroundBlob /> */}
        <CardPlan.Name>Premium</CardPlan.Name>
        <CardPlan.Price>12</CardPlan.Price>
        <CardPlan.FeaturesContainer className="pt-20">
          <CardPlan.BulletItem weight="strong">24 horas</CardPlan.BulletItem>
          <CardPlan.BulletItem>1 conta da Steam</CardPlan.BulletItem>
          <CardPlan.BulletItem>1 conta por jogo</CardPlan.BulletItem>
          <CardPlan.BulletItem>Farm 24/7</CardPlan.BulletItem>
          <CardPlan.BulletItem>Auto-restar</CardPlan.BulletItem>
        </CardPlan.FeaturesContainer>
        <CardPlan.Button>Testar agora</CardPlan.Button>
      </CardPlan.Root>
    )
  }
)

// CardPlan.displayName = "CardPlan"

interface ContextCardPlanRoot {
  planName: PlanAllNames
}

export const ContextCardPlanRoot = createContext<ContextCardPlanRoot | null>(null)

export type CardPlanRootProps = React.ComponentPropsWithoutRef<"article"> & {
  children: React.ReactNode
  highlight?: React.ReactNode
  planName: PlanAllNames
}

export const CardPlanRoot = React.forwardRef<React.ElementRef<"article">, CardPlanRootProps>(
  function CardPlanRootComponent({ planName, highlight = null, children, className, ...props }, ref) {
    return (
      <ContextCardPlanRoot.Provider
        value={{
          planName,
        }}
      >
        <article
          {...props}
          className={cn(
            "mdx:max-w-xs relative flex w-full max-w-[25rem] flex-col bg-slate-900 [&_strong]:font-semibold [&_strong]:text-white",
            className
          )}
          ref={ref}
        >
          <CardPlanHighlightCurrentPlan />
          {highlight}
          <div className="relative overflow-hidden p-8">{children}</div>
        </article>
      </ContextCardPlanRoot.Provider>
    )
  }
)

CardPlanRoot.displayName = "CardPlanRoot"

export type CardPlanHighlightProps = React.ComponentPropsWithoutRef<"div"> & {
  children?: React.ReactNode
  colorScheme?: keyof typeof buttonPrimaryHueThemes
}

export const CardPlanHighlight = React.forwardRef<React.ElementRef<"div">, CardPlanHighlightProps>(
  function CardPlanHighlightComponent(
    { colorScheme = "default", style, children, className, ...props },
    ref
  ) {
    const [appleHue, bananaHue] = buttonPrimaryHueThemes[colorScheme]
    const hues = Object.entries({ appleHue, bananaHue })

    return (
      <div
        {...props}
        className={cn(
          "absolute right-0 top-0 z-30 translate-x-4 translate-y-[-50%] bg-black px-4 py-1.5 text-sm leading-none text-white",
          st.highlight,
          className
        )}
        style={cssVariables(hues, style)}
        ref={ref}
      >
        {children ?? "Mais popular"}
      </div>
    )
  }
)

CardPlanHighlight.displayName = "CardPlanHighlight"

export type CardPlanBackgroundBlobProps = React.ComponentPropsWithoutRef<"div"> & {
  bgColor: string
}

export const CardPlanBackgroundBlob = React.forwardRef<React.ElementRef<"div">, CardPlanBackgroundBlobProps>(
  function CardPlanBackgroundBlobComponent({ bgColor, style, className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn(
          "absolute aspect-square h-[80rem] w-[80rem] translate-x-[-29rem] translate-y-[-69.7rem] rounded-full bg-[var(--bg-color)]",
          className
        )}
        style={{ "--bg-color": bgColor, ...style } as CSSProperties}
        ref={ref}
      />
    )
  }
)

CardPlanBackgroundBlob.displayName = "CardPlanBackgroundBlob"

export type CardPlanButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  asChild?: boolean
  children: React.ReactNode
}

export const CardPlanButton = React.forwardRef<React.ElementRef<typeof Button>, CardPlanButtonProps>(
  function CardPlanButtonComponent({ asChild, children, className, ...props }, ref) {
    const Component = asChild ? Slot : Button

    return (
      <Component
        {...props}
        className={cn("", className)}
        ref={ref}
      >
        {children}
      </Component>
    )
  }
)

CardPlanButton.displayName = "CardPlanButton"

export type CardPlanButtonContainerProps = React.ComponentPropsWithoutRef<"div">

export const CardPlanButtonContainer = React.forwardRef<
  React.ElementRef<"div">,
  CardPlanButtonContainerProps
>(function CardPlanButtonContainerComponent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex justify-center pt-10", className)}
      {...props}
    />
  )
})

export type CardPlanNameProps = React.ComponentPropsWithoutRef<"div"> & {
  children: React.ReactNode
}

export const CardPlanName = React.forwardRef<React.ElementRef<"div">, CardPlanNameProps>(
  function CardPlanNameComponent({ children, className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn("relative pb-4", className)}
        ref={ref}
      >
        <h2 className="text-4xl font-semibold">{children}</h2>
      </div>
    )
  }
)

CardPlanName.displayName = "CardPlanName"

export type CardPlanPriceProps = React.ComponentPropsWithoutRef<"div"> & {
  children: React.ReactNode
}

export const CardPlanPrice = React.forwardRef<React.ElementRef<"div">, CardPlanPriceProps>(
  function CardPlanPriceComponent({ children, className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn("flex justify-center", className)}
        ref={ref}
      >
        <div className="relative w-fit">
          <span className="text absolute right-full top-2 translate-x-[-2px]">R$</span>
          <span className="text-7xl font-bold leading-none">{children}</span>
          <span className="text absolute bottom-0 left-full">/mês</span>
        </div>
      </div>
    )
  }
)

CardPlanPrice.displayName = "CardPlanPrice"

export type CardPlanFeaturesContainerProps = React.ComponentPropsWithoutRef<"section"> & {
  children: React.ReactNode
}

export const CardPlanFeaturesContainer = React.forwardRef<
  React.ElementRef<"section">,
  CardPlanFeaturesContainerProps
>(function CardPlanFeaturesContainerComponent({ children, className, ...props }, ref) {
  return (
    <section
      {...props}
      className={cn("relative", className)}
      ref={ref}
    >
      <ul className="flex flex-col gap-4">{children}</ul>
    </section>
  )
})

CardPlanFeaturesContainer.displayName = "CardPlanFeaturesContainer"

export type CardPlanBulletItemProps = React.ComponentPropsWithoutRef<"li"> & {
  weight?: "strong" | "normal" | "weak"
  children: React.ReactNode
}

export const CardPlanBulletItem = React.forwardRef<React.ElementRef<"li">, CardPlanBulletItemProps>(
  function CardPlanBulletItemComponent({ weight = "normal", children, className, ...props }, ref) {
    return (
      <li
        {...props}
        className={cn(
          "flex items-center gap-3",
          {
            "text-slate-500": weight === "weak",
            "text-slate-400": weight === "normal",
            "text-slate-200": weight === "strong",
          },
          className
        )}
        ref={ref}
      >
        <SVGCheckIcon
          className={cn({
            "h-4 w-4 text-slate-500": weight === "weak",
            "h-4 w-4 text-slate-400": weight === "normal",
            "h-5 w-5 text-green-500": weight === "strong",
          })}
        />
        <span
          className={cn({
            "text-xl font-medium uppercase": weight === "strong",
            "line-through": weight === "weak",
          })}
        >
          {children}
        </span>
      </li>
    )
  }
)

export type CardPlanRootContainerProps = React.ComponentPropsWithoutRef<"div"> & {
  userPlan: IUserPlanContext
}

export const CardPlanRootContainerProvider = React.forwardRef<
  React.ElementRef<"div">,
  CardPlanRootContainerProps
>(function CardPlanRootContainerComponent({ userPlan, className, ...props }, ref) {
  return (
    <UserPlanContext.Provider value={userPlan ?? null}>
      <div
        ref={ref}
        className={cn("flex w-full justify-center gap-16", className)}
        {...props}
      />
    </UserPlanContext.Provider>
  )
})

CardPlanBulletItem.displayName = "CardPlanBulletItem"

export type CardPlanHighlightCurrentPlanProps = React.ComponentPropsWithoutRef<"div"> & {
  colorScheme?: keyof typeof buttonPrimaryHueThemes
}

export const CardPlanHighlightCurrentPlan = React.forwardRef<
  React.ElementRef<"div">,
  CardPlanHighlightCurrentPlanProps
>(function CardPlanHighlightCurrentPlanComponent(
  { style, colorScheme = "orange-yellow", className, ...props },
  ref
) {
  const cardRoot = useContext(ContextCardPlanRoot)
  const userPlan = useContext(UserPlanContext)
  const [appleHue, bananaHue] = buttonPrimaryHueThemes[colorScheme]
  const hues = Object.entries({ appleHue, bananaHue })

  if (userPlan?.planName !== cardRoot?.planName) return null

  return (
    <div
      {...props}
      className={cn(
        "absolute left-0 top-0 z-30 -translate-x-4 translate-y-[-50%] bg-black px-4 py-1.5 text-sm leading-none text-white",
        st.highlight,
        className
      )}
      style={cssVariables(hues, style)}
      ref={ref}
    >
      Seu plano atual
    </div>
  )
})

export type SVGCheckIconProps = React.ComponentPropsWithoutRef<"svg">

export function SVGCheckIcon({ ...props }: SVGCheckIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <polyline
        points="88 136 112 160 168 104"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <circle
        cx={128}
        cy={128}
        r={96}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}

export const CardPlan = {
  Root: CardPlanRoot,
  Highlight: CardPlanHighlight,
  HighlightCurrentPlan: CardPlanHighlightCurrentPlan,
  BackgroundBlob: CardPlanBackgroundBlob,
  Name: CardPlanName,
  Price: CardPlanPrice,
  FeaturesContainer: CardPlanFeaturesContainer,
  BulletItem: CardPlanBulletItem,
  Button: CardPlanButton,
  ButtonContainer: CardPlanButtonContainer,
  RootContainerProvider: CardPlanRootContainerProvider,
}
