import React from "react"
import { cn } from "@/lib/utils"

type NewPlanSlateWrapperProps = React.ComponentPropsWithoutRef<"div">

const NewPlanSlateWrapper = React.forwardRef<React.ElementRef<"div">, NewPlanSlateWrapperProps>(
  function WrapperComponent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 overflow-hidden rounded-md border-y border-b-slate-900 border-t-slate-800 bg-slate-950 px-2 py-5 shadow",
          className
        )}
        {...props}
      />
    )
  }
)

type NewPlanSlateFlashProps = React.ComponentPropsWithoutRef<"div">

const NewPlanSlateFlash = React.forwardRef<React.ElementRef<"div">, NewPlanSlateFlashProps>(
  function FlashComponent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute left-5 top-0 -z-10 h-[5rem] w-[8rem] -translate-y-[2rem] bg-slate-600 bg-gradient-to-r blur-[4rem]",
          className
        )}
        {...props}
      />
    )
  }
)

type NewPlanSlateTitleProps = React.ComponentPropsWithoutRef<"h2">

const NewPlanSlateTitle = React.forwardRef<React.ElementRef<"h2">, NewPlanSlateTitleProps>(
  function TitleComponent({ className, ...props }, ref) {
    return (
      <h2
        ref={ref}
        className={cn("text-center text-3xl font-semibold", className)}
        {...props}
      />
    )
  }
)

type NewPlanSlateTextProps = React.ComponentPropsWithoutRef<"p">

const NewPlanSlateText = React.forwardRef<React.ElementRef<"p">, NewPlanSlateTextProps>(
  function TextComponent({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn("text-center text-slate-500", className)}
        {...props}
      />
    )
  }
)

export const NewPlanSlate = {
  Wrapper: NewPlanSlateWrapper,
  Flash: NewPlanSlateFlash,
  Title: NewPlanSlateTitle,
  Text: NewPlanSlateText,
}
