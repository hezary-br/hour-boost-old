import { defaultValues } from "@/components/molecules/ModalAddSteamAccount/controller"
import { FormType } from "@/components/molecules/ModalAddSteamAccount/form"
import { createContext, useContext, useRef, useState } from "react"
import { UseFormReturn } from "react-hook-form"

export function createStater(formContext: UseFormReturn<FormType>) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // const [isRequiringSteamGuard, setIsRequiringSteamGuard] = useState(false)
  const [formStep, setFormStep] = useState<FormStep>("CREDENTIALS")
  const [requiredSteamGuardAccounts, setRequiredSteamGuardAccounts] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const refInputSteamGuard = useRef<HTMLInputElement | null>(null)
  const refSubmitButton = useRef<HTMLButtonElement | null>(null)
  const focusSubmitButton = () => refSubmitButton.current?.focus()
  const requireSteamGuard = () => {
    const accountName = formContext.getValues("accountName")
    setRequiredSteamGuardAccounts(an => (an.includes(accountName) ? an : [...an, accountName]))
    setFormStep("STEAM-GUARD")
    setTimeout(() => {
      refInputSteamGuard.current?.focus()
    }, 0)
  }
  const goBackToCredentials = () => {
    setFormStep("CREDENTIALS")
    formContext.resetField("authCode")
    setTimeout(() => focusSubmitButton(), 0)
  }
  const resetFormFields = () => formContext.reset(defaultValues)
  const resetForm = () => {
    setFormStep("CREDENTIALS")
    resetFormFields()
    setIsSubmitting(false)
  }
  const isRequiringSteamGuard = formStep === "STEAM-GUARD"

  function useStaterForm() {
    return {
      form: {
        steps: {
          CREDENTIALS: {
            submit() {
              // CHECAGEM PARA SABER QUE USUARIO JA TEM UMA CONTA STEAM NO DASHBOARD COM ESSE NOME
              const accountName = formContext.getValues("accountName")
              if (requiredSteamGuardAccounts.includes(accountName)) {
                requireSteamGuard()
                return [false] as const
              }
              setIsSubmitting(true)
              return [true] as const
            },
            resolveSubmit() {
              setIsSubmitting(false)
            },
            textSubmitButton: "Enviar",
            textSubmittingButton: "Enviando...",
          },
          "STEAM-GUARD": {
            submit() {
              setIsSubmitting(true)
              return [true] as const
            },
            resolveSubmit() {
              setIsSubmitting(false)
            },
            textSubmitButton: "Enviar código",
            textSubmittingButton: "Enviando código...",
          },
        } satisfies IFormSteps,
      },
    }
  }

  const { form } = useStaterForm()

  const dirtyFields = formContext.formState.dirtyFields
  const credentialsInputDirty = "accountName" in dirtyFields && "password" in dirtyFields

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }
  const openModal = () => {
    setIsModalOpen(true)
  }
  const removeAccountNameFromSteamGuardCache = () =>
    setRequiredSteamGuardAccounts(ra => ra.filter(acc => acc !== formContext.getValues("accountName")))
  const completeForm = () => {
    removeAccountNameFromSteamGuardCache()
    closeModal()
  }
  return {
    isModalOpen,
    isRequiringSteamGuard,
    isSubmitting,
    refInputSteamGuard,
    refSubmitButton,
    requiredSteamGuardAccounts,
    formStep,
    form,
    requireSteamGuard,
    focusSubmitButton,
    credentialsInputDirty,
    resetForm,
    closeModal,
    openModal,
    completeForm,
    goBackToCredentials,
  }
}
export type State = ReturnType<typeof createStater>
type FormStep = "CREDENTIALS" | "STEAM-GUARD"

export interface IFormController {
  submit(): [shouldContinue: boolean]
  resolveSubmit(): void
  textSubmitButton: string
  textSubmittingButton: string
}

export type IFormSteps = Record<FormStep, IFormController>

type StateProviderProps = React.ComponentProps<typeof StateContext.Provider>

export const StateContext = createContext<State | null>(null)

export function StateProvider(props: StateProviderProps) {
  return <StateContext.Provider {...props} />
}

export function useStater() {
  const s = useContext(StateContext)
  if (!s) throw new Error("OOC")
  return s
}
