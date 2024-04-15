import { IconSpinner } from "@/components/icons/IconSpinner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUserId } from "@/contexts/UserContext"
import { DataOrMessage } from "@/util/DataOrMessage"
import { UseMutationResult, useQueryClient } from "@tanstack/react-query"
import React from "react"
import type { SubmitHandler, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { CreateSteamAccountPayload } from "./controller"
import { FormType } from "./form"
import { IFormController, IFormSteps, useStater } from "./stater"

export type IntentionCodes = "STEAM_GUARD_REQUIRED" | "SUCCESS"

export type ModalAddSteamAccountViewProps = {
  children: React.ReactNode
  createSteamAccount: UseMutationResult<
    DataOrMessage<string, IntentionCodes>,
    Error,
    CreateSteamAccountPayload,
    unknown
  >
  form: UseFormReturn<FormType>
  resetAllFields(): void
  clearField: (field: keyof FormType) => void
}

export const ModalAddSteamAccountView = React.forwardRef<
  React.ElementRef<"form">,
  ModalAddSteamAccountViewProps
>(function ModalAddSteamAccountViewComponent(
  { form, clearField, resetAllFields, createSteamAccount, children },
  ref
) {
  const queryClient = useQueryClient()
  const s = useStater(form.watch("accountName"), resetAllFields, clearField)
  const userId = useUserId()

  const handleFormSubmit = async (
    formController: IFormController,
    accountName: string,
    password: string,
    authCode: string | undefined
  ) => {
    formController.submit()
    const [undesired, steamAccountId] = await createSteamAccount.mutateAsync({
      accountName,
      password,
      authCode,
    })
    formController.resolveSubmit()
    if (typeof steamAccountId === "string") {
      toast.success("Conta adicionada com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["me"] })
      return s.completeForm()
    }
    if (undesired) {
      if (undesired.code == "STEAM_GUARD_REQUIRED") {
        return toast[undesired.type](undesired.message)
      }
      return toast[undesired.type](undesired.message)
    }
  }

  const submitHandler: SubmitHandler<FormType> = async ({ accountName, authCode, password }) => {
    const formControllersMap: IFormSteps = {
      "STEAM-GUARD": s.form.steps["STEAM-GUARD"],
      CREDENTIALS: s.form.steps["CREDENTIALS"],
    }
    const formController = formControllersMap[s.formStep]
    await handleFormSubmit(formController, accountName, password, authCode)
  }

  const { textSubmitButton, textSubmittingButton } = s.form.steps[s.formStep]

  return (
    <Dialog
      open={s.isModalOpen}
      onOpenChange={isOpen => (isOpen ? s.openModal() : s.closeModal())}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitHandler)}
            ref={ref}
          >
            <DialogHeader>
              <DialogTitle>Adicionar conta Steam</DialogTitle>
              <DialogDescription className="pb-4">
                Para adicionar uma nova conta da Steam ao seu dashboard, preencha os campos abaixo e clique em
                enviar. Caso seu login peça <strong>Steam Guard</strong>, preencha o campo e submeta
                novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="pb-5">
              {/* <FlipMove
                easing="ease"
                enterAnimation="fade"
                leaveAnimation="fade"
                staggerDelayBy={100}
                staggerDurationBy={100}
                duration={500}
                maintainContainerHeight
              > */}
              <div className="pb-1">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        data-disabled={s.isRequiringSteamGuard}
                        className="data-[disabled=true]:text-slate-500"
                      >
                        Nome da conta
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="account name"
                          disabled={s.isRequiringSteamGuard}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="pb-1">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        data-disabled={s.isRequiringSteamGuard}
                        className="data-[disabled=true]:text-slate-500"
                      >
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="password"
                          type="password"
                          disabled={s.isRequiringSteamGuard}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {s.isRequiringSteamGuard && (
                <FormField
                  control={form.control}
                  name="authCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        data-disabled={s.isRequiringSteamGuard}
                        className="data-[disabled=true]:text-slate-500"
                      >
                        Código Steam Guard
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="HKS9LX"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* </FlipMove> */}
            </div>
            <footer className="flex flex-col-reverse justify-between gap-2 sm:flex-row">
              <Button
                disabled={s.isSubmitting}
                type="submit"
                className="relative"
              >
                <span className="px-8">{s.isSubmitting ? textSubmittingButton : textSubmitButton}</span>
                {s.isSubmitting && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <IconSpinner className="h-5 w-5" />
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => (s.isRequiringSteamGuard ? s.goBackToCredentials() : s.requireSteamGuard())}
              >
                <span>{s.isRequiringSteamGuard ? "Voltar" : "Tenho o código"}</span>
              </Button>
            </footer>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
})

ModalAddSteamAccountView.displayName = "ModalAddSteamAccountView"
