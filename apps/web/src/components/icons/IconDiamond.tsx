import { cn } from "@/lib/utils"
import React from "react"

export type IconDiamondProps = React.ComponentPropsWithoutRef<"svg">

export function IconDiamond({ className, ...props }: IconDiamondProps) {
  return (
    <svg
      {...props}
      className={cn("", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <polygon
        points="72 40 184 40 240 104 128 224 16 104 72 40"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <polygon
        points="176 104 128 224 80 104 128 40 176 104"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <line
        x1={16}
        y1={104}
        x2={240}
        y2={104}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}
