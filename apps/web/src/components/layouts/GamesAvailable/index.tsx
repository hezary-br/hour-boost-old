import React from "react"
import { cn } from "@/lib/utils"
import { ButtonPrimary } from "@/components/theme/button-primary"
import st from "./styles.module.css"
import { SVGWhiteDots } from "@/components/svgs/white-dots"

export type GamesAvailableSectionProps = React.ComponentPropsWithoutRef<"section"> & {}

export const GamesAvailableSection = React.forwardRef<
  React.ElementRef<"section">,
  GamesAvailableSectionProps
>(function GamesAvailableSectionComponent({ className, ...props }, ref) {
  return (
    <section
      {...props}
      className={cn("relative flex grow flex-wrap gap-6 overflow-hidden bg-slate-950", className)}
      ref={ref}
    >
      <div className="max-w-8xl absolute inset-0 mx-auto h-full w-full">
        <div className={cn("absolute inset-0", st.gamesImageFXs)}>
          <img
            src="https://www.techspot.com/articles-info/1429/images/2017-06-25-image.jpg"
            className="fillimg object-cover opacity-80"
          />
        </div>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-between px-4 pt-14 md:px-8">
        <div
          className="absolute left-28 top-0 h-[1px] w-[24rem]"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsla(var(--accent) / 40%), transparent), linear-gradient(90deg, transparent, hsl(0,0%,20%), transparent)",
          }}
        />
        <div
          className="absolute z-[9] h-[31rem] w-[10rem] rounded-[100%] bg-[hsl(var(--accent))] opacity-40 blur-[76px] saturate-50"
          style={{
            transform: "rotate(28deg) translate(1rem, -14rem)",
          }}
        />
        <div className="relative z-10 flex flex-col">
          <span className="block text-[clamp(1.7rem,_10.7vw,_3.7rem)] font-semibold leading-none md:text-[5rem]">
            São mais de
          </span>
          <span className="block text-[clamp(2rem,_14.8vw,_5.1rem)] font-black leading-none md:text-[7rem]">
            98.829 jogos
          </span>
          <span className="block text-[clamp(1.1rem,_8.9vw,_3rem)] font-semibold leading-none md:text-[4rem]">
            disponíveis!
          </span>
        </div>
      </div>
      <div className="relative z-20 flex w-full justify-center gap-20 pt-12 md:pt-20">
        <ButtonPrimary colorScheme="cyan-blue">Ver planos</ButtonPrimary>
      </div>
      <div className="h-[18rem] w-full md:h-[27rem]"></div>
      <div className={st.divisor}>
        <SVGWhiteDots />
      </div>
    </section>
  )
})

GamesAvailableSection.displayName = "GamesAvailableSection"
