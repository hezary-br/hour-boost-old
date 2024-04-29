import { FormType } from "@/components/molecules/ModalAddSteamAccount/form"
import { useStater } from "@/components/molecules/ModalAddSteamAccount/stater"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import React from "react"
import { useController, useFormContext } from "react-hook-form"

export type InputSteamGuardProps = React.ComponentPropsWithoutRef<typeof Input>

export const InputSteamGuard = React.forwardRef<React.ElementRef<typeof Input>, InputSteamGuardProps>(
  function InputSteamGuardComponent({ className, ...props }, ref) {
    const { control } = useFormContext<FormType>()
    const s = useStater()
    const { field } = useController<FormType>({
      name: "authCode",
      control,
    })

    const handleInputChange = event => {
      field.onChange(event.target.value.toUpperCase())
    }

    return (
      <Input
        maxLength={5}
        placeholder="HKS9LX"
        {...field}
        onChange={handleInputChange}
        ref={s.refInputSteamGuard}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
