"use client"
import { cn } from "@/lib/utils"
import { formatTimeSinceShort } from "core"
import { createContext, useContext, useEffect, useState } from "react"

export function useTimeSince(date: Date) {
  const [timeSince, setTimeSince] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const differenceInMilliseconds = now.getTime() - date.getTime()
      setTimeSince(timeSince => {
        if (timeSince > 1000 * 60 * 60) clearInterval(interval)
        return differenceInMilliseconds
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { timeSince: formatTimeSinceShort(timeSince) }
}

interface ITimeSinceContext {
  highlightTime: string
  secondaryTime: string
}

const TimeSinceContext = createContext({} as ITimeSinceContext)

import React from "react"

export type TimeSinceRootProps = React.ComponentPropsWithoutRef<"div"> & {
  date: Date
  children: React.ReactNode
  column?: boolean
}

export const TimeSinceRoot = React.forwardRef<React.ElementRef<"div">, TimeSinceRootProps>(
  function TimeSinceRootComponent({ column, children, date, className, ...props }, ref) {
    const dateInstance = typeof date === "string" ? new Date(date) : date
    const { timeSince } = useTimeSince(dateInstance)
    const [timeNumber, category, ...secondaryRest] = timeSince.split(" ")

    const highlightTime = [timeNumber, category].join(" ")
    const secondaryTime = secondaryRest.join(" ")

    return (
      <TimeSinceContext.Provider
        value={{
          highlightTime,
          secondaryTime,
        }}
      >
        <div
          {...props}
          className={cn("relative flex tabular-nums", column && "flex-col", className)}
          ref={ref}
        >
          {children}
        </div>
      </TimeSinceContext.Provider>
    )
  }
)

TimeSinceRoot.displayName = "TimeSinceRoot"

export type TimeSinceHighlightTimeProps = React.ComponentPropsWithoutRef<"strong"> & {}

export const TimeSinceHighlightTime = React.forwardRef<
  React.ElementRef<"strong">,
  TimeSinceHighlightTimeProps
>(function TimeSinceHighlightTimeComponent({ className, ...props }, ref) {
  const { highlightTime } = useContext(TimeSinceContext)

  return (
    <strong
      {...props}
      className={cn("whitespace-nowrap font-medium leading-none", className)}
      ref={ref}
    >
      {highlightTime}
    </strong>
  )
})

TimeSinceHighlightTime.displayName = "TimeSinceHighlightTime"

export type TimeSinceSecondaryTimeProps = React.ComponentPropsWithoutRef<"span"> & {
  suspense?: "bottom" | false
}

export const TimeSinceSecondaryTime = React.forwardRef<React.ElementRef<"span">, TimeSinceSecondaryTimeProps>(
  function TimeSinceSecondaryTimeComponent({ suspense = "bottom", className, ...props }, ref) {
    const { secondaryTime } = useContext(TimeSinceContext)

    const Text: React.FC = () => (
      <span
        {...props}
        className={cn("whitespace-nowrap pt-0.5 text-xs leading-none text-slate-500", className)}
        ref={ref}
      >
        {secondaryTime}
      </span>
    )

    if (suspense === false) return <Text />

    return (
      <div className="absolute top-full">
        <Text />
      </div>
    )
  }
)

TimeSinceSecondaryTime.displayName = "TimeSinceSecondaryTime"

export const TimeSince = {
  Root: TimeSinceRoot,
  HighlightTime: TimeSinceHighlightTime,
  SecondaryTime: TimeSinceSecondaryTime,
}
