import { IconPlus } from "@/components/icons/IconPlus"
import { IconSpinner } from "@/components/icons/IconSpinner"
import { useUserAdminItemId } from "@/components/layouts/pages/admin/UserItemAction/context"
import { DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useAuth } from "@clerk/clerk-react"
import React, { useCallback, useReducer, useState } from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"
import { useUserAdminListItem } from "../../../hooks/useUserAdminListItem"
import { isMutationPending } from "../../ActionSetGamesLimit/components/MenuSubContent"
import { HoverCard, Pieces } from "../../components"
import { useUserAdminActionSetAccounts } from "../mutation"

export type ActionSetAccountsLimitMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuSubContent
> & {
  render: React.FC<{ isSure: boolean; setIsSure: React.Dispatch<React.SetStateAction<boolean>> }>
}

export function ActionSetAccountsLimitMenuSubContent(props: ActionSetAccountsLimitMenuSubContentProps) {
  const userId = useUserAdminItemId()
  const maxSteamAccounts = useUserAdminListItem(userId, user => user.plan.maxSteamAccounts)

  return (
    <ActionSetAccountsLimitMenuSubContentView
      {...props}
      maxSteamAccounts={maxSteamAccounts}
    />
  )
}

export const ActionSetAccountsLimitMenuSubContentView = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  ActionSetAccountsLimitMenuSubContentProps & {
    maxSteamAccounts: number
  }
>(function ActionSetAccountsLimitMenuSubContentComponent({ maxSteamAccounts, render, ...props }, ref) {
  const { getToken } = useAuth()
  const valueIsDirty = useCallback((value: number) => value !== maxSteamAccounts, [maxSteamAccounts])
  const userId = useUserAdminItemId()
  const [isSure, setIsSure] = useState(false)
  const [inputValueMaxAccounts, setInputValueMaxAccounts] = useReducer((_: string, value: string) => {
    let finalValue = value
    if (parseInt(value) < 1) finalValue = "1"
    const newMaxAccountsNumber = finalValue === "" ? 1 : parseInt(finalValue)
    if (!valueIsDirty(newMaxAccountsNumber)) setIsSure(false)
    return finalValue
  }, maxSteamAccounts.toString())
  // }, maxSteamAccounts.toString())

  const inputValueMaxAccountsFinal = inputValueMaxAccounts === "" ? 1 : parseInt(inputValueMaxAccounts)
  const isDirty = valueIsDirty(inputValueMaxAccountsFinal)
  const isPending = isMutationPending(ECacheKeys.setAccounts)

  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }

  const mutationSetAccounts = useUserAdminActionSetAccounts(getAPI)

  const handleClick = () => {
    let localNewMax = parseInt(inputValueMaxAccounts)
    if (inputValueMaxAccounts === "" || inputValueMaxAccountsFinal < 0) {
      localNewMax = 1
      setInputValueMaxAccounts("1")
    }
    if (!isSure && !valueIsDirty(localNewMax)) return
    setIsSure(s => !s)

    if (isSure) {
      mutationSetAccounts.mutate(
        {
          newMaxSteamAccountsAllowed: inputValueMaxAccountsFinal,
          mutatingUserId: userId,
        },
        {
          onSuccess([undesired, message]) {
            if (undesired) {
              toast[undesired.type](undesired.message)
              return
            }
            toast.success(message)
          },
        }
      )
    }
  }

  return (
    <Pieces.Container
      {...props}
      ref={ref}
    >
      <Pieces.Header>
        <Pieces.HeaderTitle>Máximo de contas:</Pieces.HeaderTitle>
        <Pieces.HeaderSubjectAmount>{maxSteamAccounts}</Pieces.HeaderSubjectAmount>
      </Pieces.Header>
      {/* <div className="pt-2" /> */}
      {isDirty && (
        <Pieces.ThinMiddle>
          <span className="text-[10px]/none text-amber-500">Alterado</span>
        </Pieces.ThinMiddle>
      )}
      <Pieces.Footer>
        <Pieces.Input
          className="w-[180px]"
          type="number"
          value={inputValueMaxAccounts}
          onChange={e => setInputValueMaxAccounts(e.target.value)}
        />

        {isPending && (
          <Pieces.Loading>
            <IconSpinner
              color={twc.slate["200"]}
              className="size-3 animate-pulse"
            />
          </Pieces.Loading>
        )}
        {!isPending && (
          <Pieces.Trigger onClick={handleClick}>
            {!isSure && <IconPlus className="size-3 text-white" />}
            {isSure && render({ isSure, setIsSure })}
            <HoverCard data-open={isSure}>
              <p>- Máximo de contas -</p>
              <p className="bg-accent border-accent-500 mt-1 rounded-md border px-2 py-1 text-sm/none tabular-nums">
                De <strong>{maxSteamAccounts}</strong> para <strong>{inputValueMaxAccountsFinal}</strong>
              </p>
              <span className="mt-1 text-xs text-slate-500">Tem certeza que deseja fazer alteração?</span>
            </HoverCard>
          </Pieces.Trigger>
        )}
      </Pieces.Footer>
    </Pieces.Container>
  )
})

ActionSetAccountsLimitMenuSubContent.displayName = "ActionSetAccountsLimitMenuSubContent"
