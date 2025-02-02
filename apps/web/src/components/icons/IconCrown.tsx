import { cn } from "@/lib/utils"
import React from "react"

export type IconCrownProps = React.ComponentPropsWithoutRef<"svg">

export function IconCrown({ className, ...props }: IconCrownProps) {
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
      <path
        d="M53.22,200S80,184,128,184s74.78,16,74.78,16l37-113.39a4.09,4.09,0,0,0-5.71-5l-53.43,26.64a4.12,4.12,0,0,1-5.35-1.56L131.52,34a4.1,4.1,0,0,0-7,0L80.71,106.72a4.11,4.11,0,0,1-5.36,1.56L22,81.66a4.1,4.1,0,0,0-5.72,5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}
