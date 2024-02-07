import { cn } from "@/lib/utils"
import React from "react"

export type IconUserMinusProps = React.ComponentPropsWithoutRef<"svg">

export function IconUserMinus({ className, ...props }: IconUserMinusProps) {
  return (
    <svg
      {...props}
      className={cn("lucide lucide-user-minus", className)}
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle
        cx={9}
        cy={7}
        r={4}
      />
      <line
        x1={22}
        x2={16}
        y1={11}
        y2={11}
      />
    </svg>
  )
}
