import { IconSpinner } from "@/components/icons/IconSpinner"
import { cn } from "@/lib/utils"
import twc from "tailwindcss/colors"

export function FallbackNoUserYet({
  wasTriggered,
  centerScreen,
}: {
  wasTriggered?: boolean
  centerScreen?: boolean
}) {
  return (
    <div
      className={cn(centerScreen && "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -scale-x-100")}
    >
      <IconSpinner
        color={twc["slate"]["600"]}
        className="animate-spin-r size-24"
      />
    </div>
  )
}
