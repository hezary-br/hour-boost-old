import { cn } from "@/lib/utils"
import React from "react"

export type IconMedalProps = React.ComponentPropsWithoutRef<"svg">

export function IconMedal({ className, ...props }: IconMedalProps) {
  return (
    <svg
      {...props}
      className={cn("lucide lucide-medal", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <circle
        cx={128}
        cy={184}
        r={40}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <path
        d="M128,144l82.72-37.6A9,9,0,0,0,216,98.2V49a9,9,0,0,0-9-9H49a9,9,0,0,0-9,9V98.2a9,9,0,0,0,5.28,8.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <line
        x1={168}
        y1={40}
        x2={168}
        y2="125.82"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <line
        x1={88}
        y1={40}
        x2={88}
        y2="125.82"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}
