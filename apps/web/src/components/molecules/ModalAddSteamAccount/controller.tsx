import { StateProvider, createStater } from "@/components/molecules/ModalAddSteamAccount/stater"
import { Form } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import React from "react"
import { useForm } from "react-hook-form"
import { FormType, formSchema } from "./form"
import { ModalAddSteamAccountView } from "./view"

export const defaultValues: FormType = {
  accountName: "",
  authCode: "",
  password: "",
}

export type ModalAddSteamAccountProps = {
  children: React.ReactNode
}

export const ModalAddSteamAccount = React.forwardRef<
  React.ElementRef<typeof ModalAddSteamAccountView>,
  ModalAddSteamAccountProps
>(function ModalAddSteamAccountComponent({ children, ...props }, ref) {
  const form = useForm<FormType>({
    mode: "onSubmit",
    defaultValues,
    resolver: zodResolver(formSchema),
  })
  const s = createStater(form)

  return (
    <Form {...form}>
      <StateProvider value={s}>
        <ModalAddSteamAccountView
          {...props}
          ref={ref}
        >
          {children}
        </ModalAddSteamAccountView>
      </StateProvider>
    </Form>
  )
})

ModalAddSteamAccount.displayName = "ModalAddSteamAccount"

export type CreateSteamAccountPayload = {
  accountName: string
  password: string
  authCode?: string
}
