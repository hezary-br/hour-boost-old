import { ContextCardPlanRoot, UserPlanContext } from "@/components/cards/CardPlan"
import { ButtonPreapprovalActionProps } from "@/components/layouts/pages/plans/components/ButtonPreapprovalAction.view"
import { usePreApprovalPlan } from "@/components/layouts/pages/plans/preapproval-plan/mutation"
import { generateColorSchema } from "@/components/theme/button-primary"
import { useUser } from "@/contexts/UserContext"
import { useServerMeta } from "@/contexts/server-meta"
import { ECacheKeys } from "@/mutations/queryKeys"
import { useClerk } from "@clerk/clerk-react"
import { useIsMutating } from "@tanstack/react-query"
import { useRouter } from "next/router"
import { useCallback, useContext, useMemo } from "react"
import { toast } from "sonner"

type UseButtonPreapprovalActionProps = Omit<ButtonPreapprovalActionProps, "children">

export function useButtonPreapprovalAction({
  colorScheme,
  dontGoBackAtThisPage,
}: UseButtonPreapprovalActionProps) {
  const userPlan = useContext(UserPlanContext)
  const cardRoot = useContext(ContextCardPlanRoot)
  if (!cardRoot) throw new Error("Card root not provided.")
  const serverMeta = useServerMeta()
  const userId = serverMeta?.session?.userId
  const planName = serverMeta?.session?.planName
  const router = useRouter()
  const clerk = useClerk()
  const { plan_interested } = router.query
  const email = useUser(user => user.email)

  const interestedInThisPlan = plan_interested === cardRoot.planName && "animate-ping"
  const shouldPing = interestedInThisPlan && planName !== cardRoot.planName
  const loadingUserEmail = email.status === "pending"

  const preApprovalPlan = usePreApprovalPlan(cardRoot.planName, userId)
  const hasSomeMutation = !!useIsMutating({ mutationKey: clean(ECacheKeys.preAprovalPlan()) })
  const isMutatingThisCard = !!useIsMutating({
    mutationKey: ECacheKeys.preAprovalPlan(cardRoot.planName, userId),
  })

  const pending = useMemo(() => loadingUserEmail || hasSomeMutation, [loadingUserEmail, hasSomeMutation])
  const pendingHard = useMemo(
    () => loadingUserEmail || isMutatingThisCard,
    [loadingUserEmail, isMutatingThisCard]
  )

  const actionClick = useCallback(() => {
    if (loadingUserEmail) {
      return toast.info("Carregando informações do seu usuário.")
    }
    if (!userId || !email.data) {
      if (dontGoBackAtThisPage) return clerk.redirectToSignIn()
      return clerk.redirectToSignIn({
        afterSignInUrl: `/plans?plan_interested=${cardRoot.planName}`,
      })
    }
    preApprovalPlan.mutate(
      {
        planName: cardRoot.planName,
        userId,
        email: email.data,
      },
      {
        onSuccess({ checkoutUrl }) {
          toast.info("Redirecionando...")
          router.push(checkoutUrl)
        },
      }
    )
  }, [loadingUserEmail, preApprovalPlan.mutate, cardRoot.planName, email.data, userId, dontGoBackAtThisPage])

  const disabled = useMemo(
    () => userPlan?.planName === cardRoot.planName || pending,
    [userPlan?.planName, cardRoot.planName, pending]
  )

  return {
    shouldPing,
    actionClick,
    disabled,
    pending,
    pendingHard,
  }
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

function clean<T>(array: Array<T | undefined | null>): T[] {
  return array.filter(nonNullable)
}
