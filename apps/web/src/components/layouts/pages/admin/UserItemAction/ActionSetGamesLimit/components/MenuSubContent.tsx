import { IconPlus } from "@/components/icons/IconPlus"
import { IconSpinner } from "@/components/icons/IconSpinner"
// import { useUserAdminStore } from "@/components/layouts/pages/admin/store/UserAdminItemStore"
import { DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/axios"
import { ECacheKeys } from "@/mutations/queryKeys"
import { UserAdminPanelSession } from "@/pages/admin"
import { useAuth } from "@clerk/clerk-react"
import { MutationKey, useMutationState, useQuery } from "@tanstack/react-query"
import React, { useState } from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"
import {
  ActionSelect,
  ActionSelectContent,
  ActionSelectItem,
  ActionSelectTrigger,
  ActionSelectValue,
  HoverCard,
  Pieces,
} from "../../components"
import { useUserAdminItem } from "../../context"
import { useUserAdminActionSetGames } from "../mutation"

export type ActionSetGamesLimitMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuSubContent
> & {
  render: React.FC<{ isSure: boolean; setIsSure: React.Dispatch<React.SetStateAction<boolean>> }>
}

export const ActionSetGamesLimitMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  ActionSetGamesLimitMenuSubContentProps
>(function ActionSetGamesLimitMenuSubContentComponent({ render, ...props }, ref) {
  const userId = useUserAdminItem(state => state.id_user)
  const maxGamesAllowed = useUserAdminItem(state => state.plan.maxGamesAllowed)
  // const { data: user } = useQuery<UserAdminPanelSession>({
  //   queryKey: [...ECacheKeys["USER-ADMIN-ITEM-LIST"], userId],
  //   staleTime: Infinity,
  //   refetchOnWindowFocus: false,
  // })
  // if (!user) {
  //   console.log({ subContent_user: user })
  //   throw new Error("No user found")
  // }
  // const { maxGamesAllowed } = user.plan

  const { getToken } = useAuth()
  const getAPI = async () => {
    api.defaults.headers["Authorization"] = `Bearer ${await getToken()}`
    return api
  }
  const mutationSetGames = useUserAdminActionSetGames(getAPI)

  // const maxGamesAllowed = useUserAdminStore(state => state.maxGamesAllowed)
  // const userId = useUserAdminStore(state => state.userId)
  // const handleSetGamesLimit = useUserAdminStore(state => state.setGamesLimit_handle)
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
          newGamesLimit: inputValueMaxGamesLimit,
          userId,
        },
        {
          onSuccess([undesired, message], { newGamesLimit }) {
            if (undesired) {
              toast[undesired.type](undesired.message)
              return
            }
            toast.success(message)
            console.log(`games set to [${newGamesLimit}]`)
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
            {isSure && render({ isSure, setIsSure })}
            <HoverCard data-open={isSure}>
              <p>- Máximo de jogos -</p>
              <p className="tabular-nums text-sm/none py-1 px-2 rounded-md bg-accent border border-accent-500 mt-1">
                De <strong>{maxGamesAllowed}</strong> para <strong>{inputValueMaxGamesLimit}</strong>
              </p>
              <span className="text-xs text-slate-500 mt-1">Tem certeza que deseja fazer alteração?</span>
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
