import { IconPlus } from "@/components/icons/IconPlus"
import { IconSpinner } from "@/components/icons/IconSpinner"
// import { useUserAdminStore } from "@/components/layouts/pages/admin/store/UserAdminItemStore"
import { DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useAuth } from "@clerk/clerk-react"
import { MutationKey, useMutationState } from "@tanstack/react-query"
import React, { useState } from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"
import { useUserAdminListItem } from "../../../hooks/useUserAdminListItem"
import {
  ActionSelect,
  ActionSelectContent,
  ActionSelectItem,
  ActionSelectTrigger,
  ActionSelectValue,
  HoverCard,
  Pieces,
} from "../../components"
import { useUserAdminItemId } from "../../context"
import { useUserAdminActionSetGames } from "../mutation"

export type ActionSetGamesLimitMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuSubContent
> & {}

export const ActionSetGamesLimitMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  ActionSetGamesLimitMenuSubContentProps
>(function ActionSetGamesLimitMenuSubContentComponent({ children, ...props }, ref) {
  const userId = useUserAdminItemId()
  const maxGamesAllowed = useUserAdminListItem(userId, user => user.plan.maxGamesAllowed)

  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }
  const mutationSetGames = useUserAdminActionSetGames(getAPI)

  const [isSure, setIsSure] = useState(false)
  const [inputValueMaxGamesLimit, setInputValueMaxGamesLimit] = useState(maxGamesAllowed)
  const isDirty = maxGamesAllowed !== inputValueMaxGamesLimit

  const isPending = isMutationPending(ECacheKeys.setGames)

  const handleClick = async () => {
    if (!isSure && inputValueMaxGamesLimit === maxGamesAllowed) return
    setIsSure(s => !s)

    if (isSure) {
      mutationSetGames.mutate(
        {
          mutatingUserId: userId,
          newMaxGamesAllowed: inputValueMaxGamesLimit,
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

  const handleOnChange = (newValue: string) => {
    const value = parseInt(newValue)
    if (value !== inputValueMaxGamesLimit) setIsSure(false)
    setInputValueMaxGamesLimit(value)
  }

  return (
    <Pieces.Container
      {...props}
      ref={ref}
    >
      <Pieces.Header>
        <Pieces.HeaderTitle>Máximo de jogos permitidos:</Pieces.HeaderTitle>
        <Pieces.HeaderSubjectAmount>{maxGamesAllowed}</Pieces.HeaderSubjectAmount>
      </Pieces.Header>
      {isDirty && (
        <Pieces.ThinMiddle>
          <span className="text-[10px]/none text-amber-500">Alterado</span>
        </Pieces.ThinMiddle>
      )}
      <Pieces.Footer>
        <ActionSelect
          value={inputValueMaxGamesLimit.toString()}
          onValueChange={handleOnChange}
        >
          <ActionSelectTrigger>
            <ActionSelectValue placeholder="Novo máx. de contas" />
          </ActionSelectTrigger>
          <ActionSelectContent>
            {options.map(opt => (
              <ActionSelectItem
                key={opt.value}
                data-selected={maxGamesAllowed === opt.value}
                value={opt.value.toString()}
              >
                {opt.text}
              </ActionSelectItem>
            ))}
          </ActionSelectContent>
        </ActionSelect>
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
            {isSure && children}
            <HoverCard data-open={isSure}>
              <p>- Máximo de jogos -</p>
              <p className="bg-accent border-accent-500 mt-1 rounded-md border px-2 py-1 text-sm/none tabular-nums">
                De <strong>{maxGamesAllowed}</strong> para <strong>{inputValueMaxGamesLimit}</strong>
              </p>
              <span className="mt-1 text-xs text-slate-500">Tem certeza que deseja fazer alteração?</span>
            </HoverCard>
          </Pieces.Trigger>
        )}
      </Pieces.Footer>
    </Pieces.Container>
  )
})

ActionSetGamesLimitMenuSubContent.displayName = "ActionSetGamesLimitMenuSubContent"

const options = Array.from({ length: 32 }).map((_, i) => ({
  value: ++i,
  text: `${i} jogos`,
}))

export function isMutationPending(mutationKey: MutationKey) {
  const mutationsPending = useMutationState({
    filters: {
      mutationKey,
      status: "pending",
    },
  })
  return mutationsPending.length > 0
}
