import { useAddSteamGuard } from "@/components/molecules/SteamAccountListItem/AddSteamCode/mutation"
import { useSteamAccount } from "@/components/molecules/ToggleAutoRelogin/controller"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ECacheKeys } from "@/mutations/queryKeys"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutationState } from "@tanstack/react-query"
import React, { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

type AddSteamCodePopoverProps = Omit<React.ComponentPropsWithoutRef<typeof Popover>, "open" | "onOpenChange">

const addSteamCodeSchema = z.object({
  code: z.string().length(5, "O código steam guard possui 5 dígitos.").or(z.literal("")),
})
type Schema = z.infer<typeof addSteamCodeSchema>

export function AddSteamCodePopover({ children, ...props }: AddSteamCodePopoverProps) {
  const [open, setOpen] = useState(false)
  const accountName = useSteamAccount(sa => sa.accountName)
  const { reset, register, handleSubmit, formState } = useForm<Schema>({
    mode: "onTouched",
    resolver: zodResolver(addSteamCodeSchema),
  })

  const addSteamGuard = useAddSteamGuard({ accountName })
  const mutation = useMutationState({
    filters: {
      mutationKey: ECacheKeys.addSteamGuard(accountName),
    },
  })

  const mutationsPending = mutation.filter(m => m.status === "pending")
  const hasMutationPending = mutationsPending.length > 0

  const sendSteamCode: SubmitHandler<Schema> = ({ code }) => {
    addSteamGuard.mutate(
      {
        accountName,
        code,
      },
      {
        onSuccess([undesired, message]) {
          if (undesired) {
            toast[undesired.type](undesired.message)
            return
          }

          toast.success(message)
          setOpen(false)
          reset()
        },
      }
    )
  }

  return (
    <Popover
      {...props}
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        collisionPadding={38}
      >
        <h2 className="text-lg font-semibold">Adicionar Steam Guard</h2>
        <p className="text-sm text-slate-400">Essa conta precisa do código Steam Guard para continuar.</p>
        <form onSubmit={handleSubmit(sendSteamCode)}>
          <Input
            className="mt-1"
            placeholder="HKS9LX"
            autoComplete="off"
            maxLength={5}
            {...register("code")}
          />
          <div className="flex h-12 items-center gap-2 pt-2">
            <p className={cn("text-sm/none text-red-400", !formState.errors.code && "invisible")}>
              {formState.errors.code?.message ?? "x"}
            </p>
            <Button
              disabled={hasMutationPending}
              className="ml-auto h-full w-24 shrink-0"
              size="sm"
              variant="outline"
            >
              {/* {true ? "Enviando" : "Enviar"} */}
              {hasMutationPending ? "Enviando" : "Enviar"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
