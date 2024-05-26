import { CardPlan as CP } from "@/components/cards/CardPlan"
import { IconSpinner } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { NewPlanSlate } from "@/pages/dashboard/NewPlanSlate"
import { getPlanName } from "@/util/getPlanName"
import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PlanAllNames, only } from "core"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import twc from "tailwindcss/colors"

export type PlanSubscribedDialogProps = React.ComponentPropsWithoutRef<"div">

type Benefit = {
  weight: "strong" | "normal" | "weak"
  text_benefit: React.ReactNode
}

type Card = {
  blobBackgroundColor: string
  planName: PlanAllNames
  benefits: Benefit[]
}

export const cards: Record<PlanAllNames, Card> = {
  SILVER: {
    planName: "SILVER",
    blobBackgroundColor: twc["slate"]["400"],
    benefits: [
      {
        text_benefit: "24 horas",
        weight: "strong",
      },
      {
        text_benefit: "1 contas da Steam",
        weight: "normal",
      },
      {
        text_benefit: "1 jogo por conta",
        weight: "normal",
      },
      {
        text_benefit: "Farm 24/7",
        weight: "normal",
      },
      {
        text_benefit: "Auto-restart",
        weight: "normal",
      },
    ],
  },
  GOLD: {
    planName: "GOLD",
    blobBackgroundColor: twc["amber"]["500"],
    benefits: [
      {
        text_benefit: "24 horas",
        weight: "strong",
      },
      {
        text_benefit: <>1 contas da Steam</>,
        weight: "normal",
      },
      {
        text_benefit: (
          <>
            <strong>32</strong> jogos por conta
          </>
        ),
        weight: "normal",
      },
      {
        text_benefit: "Farm 24/7",
        weight: "normal",
      },
      {
        text_benefit: "Auto-restart",
        weight: "normal",
      },
    ],
  },
  DIAMOND: {
    planName: "DIAMOND",
    blobBackgroundColor: twc["sky"]["600"],
    benefits: [
      {
        text_benefit: "24 horas",
        weight: "strong",
      },
      {
        text_benefit: (
          <>
            <strong>2</strong> contas da Steam
          </>
        ),
        weight: "normal",
      },
      {
        text_benefit: (
          <>
            <strong>32</strong> jogos por conta
          </>
        ),
        weight: "normal",
      },
      {
        text_benefit: "Farm 24/7",
        weight: "normal",
      },
      {
        text_benefit: "Auto-restart",
        weight: "normal",
      },
    ],
  },
  GUEST: {
    planName: "GUEST",
    blobBackgroundColor: "hsl(222.22deg, 18.37%, 18.18%)",
    benefits: [
      {
        text_benefit: "6 horas",
        weight: "strong",
      },
      {
        text_benefit: "1 conta da Steam",
        weight: "normal",
      },
      {
        text_benefit: "1 jogo por conta",
        weight: "normal",
      },
      {
        text_benefit: "Farm 24/7",
        weight: "weak",
      },
      {
        text_benefit: "Auto-restart",
        weight: "weak",
      },
    ],
  },
}

type SubscriptionNotification = {
  id_subscription: string
  createdAt: Date
  updatedAt: Date
  user_id: string | null
  planName: string | null
}
type API_GET_SubscriptionNotification = SubscriptionNotification | null

export function cleanSubscribedParam(asPath: string) {
  const url = new URL(window.location.href + asPath)
  url.searchParams.delete("plan_subscribed")
  return only([url, undefined, { shallow: false }])
}

export const PlanSubscribedDialog = React.forwardRef<React.ElementRef<"div">, PlanSubscribedDialogProps>(
  function PlanSubscribedDialogComponent({ className, ...props }, ref) {
    const router = useRouter()
    const planSubscribedId = router.query.plan_subscribed as string
    const gotPlan = !!planSubscribedId
    const [mounted, setMounted] = useState(false)
    const { getToken } = useAuth()
    const ijsdf = useMutation({
      mutationKey: ["CLEAR_SUBSCRIPTION_NOTIFICATION", planSubscribedId],
      async mutationFn() {
        // TODO
      },
    })

    const deleteNotification = useMutation({
      async mutationFn() {
        await api.delete(`/subscription/notification/${planSubscribedId}`, {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        })
      },
    })

    const q = useQuery({
      queryKey: ["PLAN_SUBSCRIBED", planSubscribedId],
      enabled: gotPlan,
      retry: 3,
      async queryFn() {
        const { data: subscriptionNotification } = await api.get<API_GET_SubscriptionNotification>(
          `/subscription/notification/${planSubscribedId}`,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        )

        if (!subscriptionNotification) {
          const cleanUrl = cleanSubscribedParam(router.asPath)
          router.replace(...cleanUrl)

          toast.error("Nenhuma notificação de assinatura com esse ID.")
          return void setMounted(false)
        }
        return cards[subscriptionNotification.planName!]
      },
    })

    function proceed() {
      const cleanUrl = cleanSubscribedParam(router.asPath)
      deleteNotification.mutate()
      router.replace(...cleanUrl)
      setMounted(false)
    }

    useEffect(() => {
      setMounted(gotPlan)
    }, [])

    if (!mounted) return null

    return (
      <div
        ref={ref}
        className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/50", className)}
        {...props}
      >
        <div
          data-state={mounted ? "open" : "closed"}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-slate-900 shadow-lg duration-200 focus:outline-none md:w-full"
        >
          {q.status !== "success" ? (
            <CP.Root
              className="mdx:max-w-[unset] max-w-[999rem]"
              planName="GUEST"
            >
              <NewPlanSlate.Wrapper className="h-[6.375rem] animate-pulse">
                <NewPlanSlate.Flash />
              </NewPlanSlate.Wrapper>
              <div className="pt-8" />
              <CP.BackgroundBlob
                bgColor="hsl(222.22deg, 18.37%, 18.18%)"
                className="translate-y-[-73.7rem] animate-pulse"
              />
              <div className="mx-auto h-8 w-[15rem] animate-pulse rounded-md bg-slate-600 text-center" />
              <CP.FeaturesContainer className="pt-24">
                <div className="flex items-center justify-center py-10">
                  <div className="-scale-x-100">
                    <IconSpinner className="y-16 animate-spin-r w-16" />
                  </div>
                </div>
              </CP.FeaturesContainer>
              <CP.ButtonContainer>
                <Button disabled>
                  <span className="invisible">Prosseguir</span>
                </Button>
              </CP.ButtonContainer>
            </CP.Root>
          ) : (
            <>
              <CP.Root
                className="mdx:max-w-[unset] max-w-[999rem]"
                planName={q.data.planName}
              >
                <NewPlanSlate.Wrapper className="h-[6.375rem]">
                  <NewPlanSlate.Flash />
                  <NewPlanSlate.Title>Sua assinatura foi aprovada!</NewPlanSlate.Title>
                  <NewPlanSlate.Text>Veja os benefícios do seu novo plano!</NewPlanSlate.Text>
                </NewPlanSlate.Wrapper>
                <div className="pt-8" />
                <CP.BackgroundBlob
                  bgColor={q.data.blobBackgroundColor}
                  className="translate-y-[-73.7rem]"
                />
                <CP.Name className="text-center">{getPlanName(q.data.planName)}</CP.Name>
                <CP.FeaturesContainer className="pt-24">
                  {q.data.benefits.map(benefit => (
                    <CP.BulletItem
                      key={benefit.text_benefit?.toString()}
                      weight={benefit.weight}
                    >
                      {benefit.text_benefit}
                    </CP.BulletItem>
                  ))}
                </CP.FeaturesContainer>
                <CP.ButtonContainer>
                  <Button onClick={proceed}>Prosseguir</Button>
                </CP.ButtonContainer>
              </CP.Root>
            </>
          )}
        </div>
      </div>
    )
  }
)
