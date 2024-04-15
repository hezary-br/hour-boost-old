import { useEffect, useRef } from "react"
import { toast } from "sonner"

type MaintanceDisclousure = {}

export function MaintanceDisclousure({}: MaintanceDisclousure) {
  const maintance = process.env.NEXT_PUBLIC_MAINTANCE === "true"

  return maintance ? <MaintanceDisclousureMessage /> : null
}

type MaintanceDisclousureMessage = {}

function MaintanceDisclousureMessage({}: MaintanceDisclousureMessage) {
  const done = useRef(false)
  useEffect(() => {
    setTimeout(() => {
      if (done.current) return
      toast.warning("Servidor em manutenção.", {
        position: "top-center",
      })
      done.current = true
    }, 500)
  }, [])
  return null
}
