import { cn } from "@/lib/utils"
import twc from "tailwindcss/colors"

export type IconSpinnerProps = React.ComponentPropsWithoutRef<"svg"> & {
  color?: string
}

export function IconSpinner({ color = twc.slate["800"], className, ...props }: IconSpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      {...props}
      className={cn("", className)}
      // className={cn("animate-spin-r", className)}
    >
      <radialGradient
        id="a10"
        cx=".66"
        fx=".66"
        cy=".3125"
        fy=".3125"
        gradientTransform="scale(1.5)"
      >
        <stop
          offset={0}
          stopColor={color}
        />
        <stop
          offset=".3"
          stopColor={color}
          stopOpacity="1"
        />
        <stop
          offset=".6"
          stopColor={color}
          stopOpacity=".6"
        />
        <stop
          offset=".8"
          stopColor={color}
          stopOpacity=".1"
        />
        <stop
          offset={1}
          stopColor={color}
          stopOpacity={0}
        />
      </radialGradient>
      <circle
        transform-origin="center"
        fill="none"
        stroke="url(#a10)"
        strokeWidth={30}
        strokeLinecap="round"
        strokeDasharray="200 1000"
        strokeDashoffset={0}
        cx={100}
        cy={100}
        r={70}
      />
      <circle
        transform-origin="center"
        fill="none"
        opacity=".2"
        stroke={color}
        strokeWidth={30}
        strokeLinecap="round"
        cx={100}
        cy={100}
        r={70}
      />
    </svg>
  )
}
