import { PlanAllNames } from "core"
import twc from "tailwindcss/colors"

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
