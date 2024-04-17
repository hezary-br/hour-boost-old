import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { IconArrowClockwise } from "@/components/icons/IconArrowClockwise"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ECacheKeys } from "@/mutations/queryKeys"
import { atom, useAtom, useSetAtom } from "jotai"
import React, { useState } from "react"
import { twc } from "react-twc"
import { toast } from "sonner"
import { isMutationPending } from "../../UserItemAction/ActionSetGamesLimit/components/MenuSubContent"
import { useUserAdminItemId } from "../../UserItemAction/context"
import { useUserAdminListItem } from "../../hooks/useUserAdminListItem"
import { useUserAdminActionBanUser } from "../mutation"

const inputAtom = atom("")
const hasTypedHourboostAtom = atom(get => get(inputAtom) === "HOURBOOST")

export type AlertDialogBanUserProps = React.ComponentPropsWithoutRef<typeof AlertDialogContent> & {
  children: React.ReactNode
}

export const AlertDialogBanUser = React.forwardRef<
  React.ElementRef<typeof AlertDialogContent>,
  AlertDialogBanUserProps
>(function AlertDialogBanUserComponent({ children, className, ...props }, ref) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const userId = useUserAdminItemId()
  const username = useUserAdminListItem(userId, user => user.username)
  const closeModal = React.useCallback(() => setIsDialogOpen(false), [])

  return (
    <AlertDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    >
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent
        {...props}
        className={cn("", className)}
        ref={ref}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Banir {username}</AlertDialogTitle>
          <AlertDialogDescription>
            Para banir {username} por tempo indeterminado, digite <Accent>HOURBOOST</Accent> e clique em
            confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <InputBanUser placeholder="HOURBOOST" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <ConfirmButton onSuccess={closeModal} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})

AlertDialogBanUser.displayName = "AlertDialogBanUser"

const Accent = twc.span`inline-flex items-center text-xs/none h-4 rounded-sm px-2 bg-accent text-white font-semibold`

export type ConfirmButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  onSuccess(): void
}

export const ConfirmButton = React.forwardRef<React.ElementRef<typeof Button>, ConfirmButtonProps>(
  function ConfirmButtonComponent({ onSuccess, className, ...props }, ref) {
    const setInput = useSetAtom(inputAtom)
    const [hasTypedHourboost] = useAtom(hasTypedHourboostAtom)
    const userId = useUserAdminItemId()
    const username = useUserAdminListItem(userId, user => user.username)
    const banUserMutation = useUserAdminActionBanUser({ userId })
    const isBanningUser = isMutationPending(ECacheKeys.banUser(userId))

    const handleBanUser = () => {
      banUserMutation.mutate(
        {
          banningUserId: userId,
          username,
        },
        {
          onSuccess([undesired, message]) {
            if (undesired) {
              toast[undesired.type](undesired.message)
              return
            }

            onSuccess()
            setInput("")
            toast.success(message)
          },
        }
      )
    }

    return (
      <Button
        {...props}
        className={cn("relative px-12", className)}
        disabled={!hasTypedHourboost || isBanningUser}
        onClick={handleBanUser}
        ref={ref}
      >
        <span>Confirmar</span>
        {isBanningUser && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <IconArrowClockwise className="h-4 w-4 animate-spin" />
          </div>
        )}
      </Button>
    )
  }
)

ConfirmButton.displayName = "ConfirmButton"

export type InputBanUserProps = React.ComponentPropsWithoutRef<typeof Input> & {}

export const InputBanUser = React.forwardRef<React.ElementRef<typeof Input>, InputBanUserProps>(
  function InputBanUserComponent({ className, ...props }, ref) {
    const [input, setInput] = useAtom(inputAtom)

    return (
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        className={cn("", className)}
        ref={ref}
        {...props}
      />
    )
  }
)

InputBanUser.displayName = "InputBanUser"
