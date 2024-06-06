import { Accent } from "@/components/atoms/Accent"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useUserId } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { useCancelSubscription } from "@/use-cases/cancel-plan/mutation"
import { useRouter } from "next/router"
import React, { useState } from "react"
import { toast } from "sonner"

export type CancelPlanModalProps = React.ComponentPropsWithoutRef<typeof DialogContent>

export const CancelPlanModal = React.forwardRef<React.ElementRef<typeof DialogContent>, CancelPlanModalProps>(
  function CancelPlanModalComponent({ children, className, ...props }, ref) {
    const [input, setInput] = useState("")
    const hasTypedCancelar = input === "CANCELAR"
    const userId = useUserId()
    const router = useRouter()

    const { mutate, isPending } = useCancelSubscription(userId)

    const submit = () => {
      mutate(undefined, {
        onSuccess() {
          toast.success("Assinatura cancelada com sucesso!")
          router.reload()
        },
      })
    }
    const submitDisabled = hasTypedCancelar || isPending

    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          ref={ref}
          className={cn("", className)}
          {...props}
        >
          <DialogHeader>
            <DialogTitle>Cancelar seu plano atual ❌</DialogTitle>
            <DialogDescription>
              <strong>Essa ação é irreversível</strong>, você perderá dados referentes ao farm nesse plano e
              voltará ao plano convidado.
              <p className="pb-2 pt-2 text-white">
                Para confirmar o cancelamento de sua assinatura digite{" "}
                <Accent className="h-[unset] py-1 text-sm/none">CANCELAR</Accent>
              </p>
            </DialogDescription>
            <Input
              placeholder="CANCELAR"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </DialogHeader>
          <div className="flex justify-between">
            <Button
              variant="outline"
            >
              Fechar
            </Button>
            <Button
              variant="destructive"
              disabled={!submitDisabled}
              onClick={submit}
            >
              {isPending ? "Cancelando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)
