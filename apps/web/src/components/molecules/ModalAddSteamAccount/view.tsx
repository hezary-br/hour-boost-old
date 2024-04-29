import { IconSpinner } from "@/components/icons/IconSpinner"
import { InputSteamGuard } from "@/components/molecules/ModalAddSteamAccount/components/InputSteamGuard"
import { useCreateAccountMutation } from "@/components/molecules/ModalAddSteamAccount/mutation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/axios"
import { Message } from "@/util/DataOrMessage"
import { useAuth } from "@clerk/clerk-react"
import React from "react"
import { useFormContext, type SubmitHandler } from "react-hook-form"
import { toast } from "sonner"
import { FormType } from "./form"
import { IFormController, IFormSteps, useStater } from "./stater"

export type IntentionCodes = "STEAM_GUARD_REQUIRED" | "SUCCESS"

export type ModalAddSteamAccountViewProps = {
  children: React.ReactNode
}

export const ModalAddSteamAccountView = React.forwardRef<
  React.ElementRef<"form">,
  ModalAddSteamAccountViewProps
>(function ModalAddSteamAccountViewComponent({ children }, ref) {
  const s = useStater()
  const { getToken } = useAuth()

  const form = useFormContext<FormType>()

  const getApi = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  const createSteamAccount = useCreateAccountMutation(getApi)

  const handleFormSubmit = (
    formController: IFormController,
    accountName: string,
    password: string,
    authCode: string | undefined
  ) => {
    const [shouldContinue] = formController.submit()
    if (!shouldContinue) return
    createSteamAccount.mutate(
      {
        accountName,
        password,
        authCode,
      },
      {
        onSuccess(data) {
          if (data instanceof Message) {
            s.requireSteamGuard()
            return toast[data.type](data.message)
          }
          toast.success(data)
          s.completeForm()
        },
        onSettled() {
          formController.resolveSubmit()
        },
      }
    )
  }

  const submitHandler: SubmitHandler<FormType> = async ({ accountName, authCode, password }) => {
    const formControllersMap: IFormSteps = {
      "STEAM-GUARD": s.form.steps["STEAM-GUARD"],
      CREDENTIALS: s.form.steps["CREDENTIALS"],
    }
    const formController = formControllersMap[s.formStep]
    handleFormSubmit(formController, accountName, password, authCode)
  }

  const { textSubmitButton, textSubmittingButton } = s.form.steps[s.formStep]

  return (
    <Dialog
      open={s.isModalOpen}
      onOpenChange={isOpen => (isOpen ? s.openModal() : s.closeModal())}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form
          onSubmit={form.handleSubmit(submitHandler)}
          ref={ref}
        >
          <DialogHeader>
            <DialogTitle>Adicionar conta Steam</DialogTitle>
            <DialogDescription className="pb-4">
              Para adicionar uma nova conta da Steam ao seu dashboard, preencha os campos abaixo e clique em
              enviar. Caso seu login peça <strong>Steam Guard</strong>, preencha o campo e submeta novamente.
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
              <FormItem>
                <FormLabel
                  data-disabled={s.isRequiringSteamGuard}
                  className="data-[disabled=true]:text-slate-500"
                >
                  Código Steam Guard
                </FormLabel>
                <InputSteamGuard />
                <FormMessage />
              </FormItem>
            )}
            {/* </FlipMove> */}
          </div>
          <footer className="flex flex-col-reverse justify-between gap-2 sm:flex-row">
            <Button
              ref={s.refSubmitButton}
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
              disabled={!s.credentialsInputDirty}
              onClick={() => (s.isRequiringSteamGuard ? s.goBackToCredentials() : s.requireSteamGuard())}
            >
              <span>{s.isRequiringSteamGuard ? "Voltar" : "Tenho o código"}</span>
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
})

ModalAddSteamAccountView.displayName = "ModalAddSteamAccountView"
