import { cn } from "@/lib/utils"
import React from "react"

export type IconCircleDollarProps = React.ComponentPropsWithoutRef<"svg">

export function IconCircleDollar({ className, ...props }: IconCircleDollarProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      className={cn("", className)}
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <line
        x1={128}
        y1={72}
        x2={128}
        y2={88}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <line
        x1={128}
        y1={168}
        x2={128}
        y2={184}
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
      <path
        d="M104,168h36a20,20,0,0,0,0-40H116a20,20,0,0,1,0-40h36"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}
