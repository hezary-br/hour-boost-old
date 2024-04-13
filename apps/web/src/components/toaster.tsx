import { useMediaQuery } from "@/components/hooks"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

export function Toaster() {
  const isLessDesktop = useMediaQuery("(max-width: 896px)")

  if (isLessDesktop) return <SonnerToaster position="top-center" />

  return <SonnerToaster position="bottom-left" />
}
