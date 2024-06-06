import { TitleSection } from "@/components/atoms/TitleSection"
import { CardPlan as CP, CardPlanButtonContainer, CardPlanHighlight } from "@/components/cards/CardPlan"
import { IconCrown } from "@/components/icons/IconCrown"
import { IconDiamond } from "@/components/icons/IconDiamond"
import { IconMedal } from "@/components/icons/IconMedal"
import { ButtonPrimary } from "@/components/theme/button-primary"
import { cn } from "@/lib/utils"
import { useRouter } from "next/router"
import React from "react"

export type PlanSectionProps = React.ComponentPropsWithoutRef<"section"> & {}

export const PlanSection = React.forwardRef<React.ElementRef<"section">, PlanSectionProps>(
  function PlanSectionComponent({ className, ...props }, ref) {
    const router = useRouter()
    
    const clickChoosePlan = () => {
      router.push("/plans")
    }
    
    return (
      <section
        {...props}
        className={cn("flex w-screen grow flex-wrap justify-center gap-6 py-32 pb-72", className)}
        ref={ref}
      >
        <TitleSection className="grow pb-[4rem] text-center">Planos</TitleSection>
        <div
          className="w-full pt-16"
          id="plans"
        >
          <div className="mdx:flex-row mx-auto flex h-full w-full max-w-7xl flex-col items-center gap-16 px-4 md:justify-evenly md:gap-8 md:px-8">
            <CP.Root planName="GUEST">
              <CP.BackgroundBlob />
              <CP.Name>Grátis</CP.Name>
              <CP.Price>0</CP.Price>
              <CP.FeaturesContainer className="pt-20">
                <CP.BulletItem weight="strong">6 horas</CP.BulletItem>
                <CP.BulletItem>1 conta da Steam</CP.BulletItem>
                <CP.BulletItem>1 jogo por conta</CP.BulletItem>
                <CP.BulletItem weight="weak">Farm 24/7</CP.BulletItem>
                <CP.BulletItem weight="weak">Auto-restart</CP.BulletItem>
              </CP.FeaturesContainer>
              <CardPlanButtonContainer>
                <CP.Button onClick={clickChoosePlan}>Testar agora</CP.Button>
              </CardPlanButtonContainer>
            </CP.Root>
            <CP.Root planName="SILVER">
              <CP.BackgroundBlob className="bg-slate-400">
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
              <CardPlanButtonContainer>
                <CP.Button onClick={clickChoosePlan}>Assinar agora</CP.Button>
              </CardPlanButtonContainer>
            </CP.Root>
            <CP.Root
              planName="GOLD"
              highlight={<CardPlanHighlight className="-translate-x-4 sm:translate-x-4" />}
              className="mdx:scale-[1.1]"
            >
              <CP.BackgroundBlob className="bg-amber-500">
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
              <CardPlanButtonContainer>
                <CP.Button asChild>
                  <ButtonPrimary>Assinar agora</ButtonPrimary>
                </CP.Button>
              </CardPlanButtonContainer>
            </CP.Root>
            <CP.Root planName="DIAMOND">
              <CP.BackgroundBlob className="bg-sky-600">
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
              <CardPlanButtonContainer>
                <CP.Button onClick={clickChoosePlan}>Assinar agora</CP.Button>
              </CardPlanButtonContainer>
            </CP.Root>
          </div>
        </div>
      </section>
    )
  }
)

PlanSection.displayName = "PlanSection"
