import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SteamAccountSession } from "core"
import React from "react"

export type ViewProps = {
  steamAccount: SteamAccountSession
  handleAction(props: { id: string }): Promise<void>
}

export type AlertDialogRemoveSteamAccountViewProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogContent
> & {
  children: React.ReactNode
}

export const AlertDialogRemoveSteamAccountView = React.forwardRef<
  React.ElementRef<typeof AlertDialogContent>,
  AlertDialogRemoveSteamAccountViewProps & ViewProps
>(function AlertDialogRemoveSteamAccountViewComponent(
  { children, handleAction, steamAccount, className, ...props },
  ref
) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent
        {...props}
        className={cn("", className)}
        ref={ref}
      >
        <AlertDialogHeader className="text-white">
          <AlertDialogTitle>Remover conta da Steam</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-200">
            Esta operação removerá o vínculo entre seu usuário na nossa plataforma, e a conta{" "}
            <strong>{steamAccount.accountName}</strong>, mas você poderá readicioná-la mais tarde.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={buttonVariants({ variant: "outline" })}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() => handleAction({ id: steamAccount.id_steamAccount })}
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})

AlertDialogRemoveSteamAccountView.displayName = "AlertDialogRemoveSteamAccountView"
