import { CardPlan as CP, CardPlanHighlight } from "@/components/cards/CardPlan"
import { IconCrown, IconDiamond, IconMedal } from "@/components/icons"
import { ButtonPreapprovalAction, NotAvailable } from "@/components/layouts/pages/plans/components"
import { useServerMeta } from "@/contexts/server-meta"
import { cn } from "@/lib/utils"
import React from "react"
import twc from "tailwindcss/colors"

export type PlansCardProps = React.ComponentPropsWithoutRef<"section">

export const PlansCard = React.forwardRef<React.ElementRef<"section">, PlansCardProps>(
  function PlansCardComponent({ className, ...props }, ref) {
    const planName = useServerMeta()?.session?.planName
    const isGuest = planName === undefined

    return (
      <CP.RootContainerProvider userPlan={{ planName }}>
        <section
          ref={ref}
          className={cn(
            "mdx:flex-row mx-auto flex h-full w-full max-w-7xl flex-col items-center gap-16 px-4 md:justify-evenly md:gap-8 md:px-8",
            className
          )}
          {...props}
        >
          <CP.Root planName="GUEST">
            <NotAvailable />
            <CP.HighlightCurrentPlan />
            <CP.BackgroundBlob bgColor="hsl(222.22deg, 18.37%, 18.18%)" />
            <CP.Name>Grátis</CP.Name>
            <CP.Price>0</CP.Price>
            <CP.FeaturesContainer className="pt-20">
              <CP.BulletItem weight="strong">6 horas</CP.BulletItem>
              <CP.BulletItem>1 conta da Steam</CP.BulletItem>
              <CP.BulletItem>1 jogo por conta</CP.BulletItem>
              <CP.BulletItem weight="weak">Farm 24/7</CP.BulletItem>
              <CP.BulletItem weight="weak">Auto-restart</CP.BulletItem>
            </CP.FeaturesContainer>
            <CP.ButtonContainer>
              <ButtonPreapprovalAction dontGoBackAtThisPage={isGuest}>
                {isGuest ? "Testar" : "Escolher"}
              </ButtonPreapprovalAction>
            </CP.ButtonContainer>
          </CP.Root>
          <CP.Root planName="SILVER">
            <CP.HighlightCurrentPlan />
            <CP.BackgroundBlob bgColor={twc["slate"]["400"]}>
              <IconMedal
                className="mdx:translate-x-4 -translate-y-24 translate-x-4 rotate-[-7deg]"
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "4rem",
                  height: "4rem",
                  left: "50%",
                  color: "#c3d0e3",
                }}
              />
            </CP.BackgroundBlob>
            <CP.Name>Silver</CP.Name>
            <CP.Price>12</CP.Price>
            <CP.FeaturesContainer className="pt-20">
              <CP.BulletItem weight="strong">24 horas</CP.BulletItem>
              <CP.BulletItem>1 conta da Steam</CP.BulletItem>
              <CP.BulletItem>1 jogo por conta</CP.BulletItem>
              <CP.BulletItem>Farm 24/7</CP.BulletItem>
              <CP.BulletItem>Auto-restart</CP.BulletItem>
            </CP.FeaturesContainer>
            <CP.ButtonContainer>
              <ButtonPreapprovalAction>Assinar</ButtonPreapprovalAction>
            </CP.ButtonContainer>
          </CP.Root>
          <CP.Root
            planName="GOLD"
            className={cn(isGuest && "mdx:scale-[1.1]")}
            highlight={isGuest && <CardPlanHighlight className="-translate-x-4 sm:translate-x-4" />}
          >
            <CP.BackgroundBlob bgColor={twc["amber"]["500"]}>
              <IconCrown
                className="mdx:translate-x-[-1.7rem] translate-x-[0.9rem] translate-y-[-6.5rem] rotate-[28deg] scale-[1.8]"
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "2rem",
                  height: "2rem",
                  left: "50%",
                  color: "#ffc932",
                }}
              />
            </CP.BackgroundBlob>
            <CP.Name>Gold</CP.Name>
            <CP.Price>18</CP.Price>
            <CP.FeaturesContainer className="pt-20">
              <CP.BulletItem weight="strong">24 horas</CP.BulletItem>
              <CP.BulletItem>1 conta da Steam</CP.BulletItem>
              <CP.BulletItem>
                <strong>32</strong> jogos por conta
              </CP.BulletItem>
              <CP.BulletItem>Farm 24/7</CP.BulletItem>
              <CP.BulletItem>Auto-restart</CP.BulletItem>
            </CP.FeaturesContainer>
            <CP.ButtonContainer>
              <ButtonPreapprovalAction colorScheme={isGuest ? "default" : undefined}>
                Assinar
              </ButtonPreapprovalAction>
            </CP.ButtonContainer>
          </CP.Root>
          <CP.Root planName="DIAMOND">
            <CP.HighlightCurrentPlan />
            <CP.BackgroundBlob bgColor={twc["sky"]["600"]}>
              <IconDiamond
                style={{
                  position: "absolute",
                  bottom: "0",
                  width: "2rem",
                  height: "2rem",
                  left: "50%",
                  color: "#60f8ff",
                  transform: "translate(1.3rem, -7.5rem) rotate(-9deg) scale(2.1)",
                }}
              />
            </CP.BackgroundBlob>
            <CP.Name>Diamond</CP.Name>
            <CP.Price>22</CP.Price>
            <CP.FeaturesContainer className="pt-20">
              <CP.BulletItem weight="strong">24 horas</CP.BulletItem>
              <CP.BulletItem>
                <strong>2</strong> contas da Steam
              </CP.BulletItem>
              <CP.BulletItem>
                <strong>32</strong> jogos por conta
              </CP.BulletItem>
              <CP.BulletItem>Farm 24/7</CP.BulletItem>
              <CP.BulletItem>Auto-restart</CP.BulletItem>
            </CP.FeaturesContainer>
            <CP.ButtonContainer>
              <ButtonPreapprovalAction>Assinar</ButtonPreapprovalAction>
            </CP.ButtonContainer>
          </CP.Root>
        </section>
      </CP.RootContainerProvider>
    )
  }
)
