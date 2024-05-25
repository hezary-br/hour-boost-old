import type { PlanAllNames } from "core"
import { env } from "~/env"

export type AppStripePlan<TName extends PlanAllNames = PlanAllNames> = {
  priceId: string
  name: TName
}

export const appStripePlans: {
  [K in PlanAllNames]: AppStripePlan<K>
} = {
  GUEST: {
    priceId: env.STRIPE_SUBSCRIPTIONS_PLAN_ID_GUEST,
    name: "GUEST",
  },
  SILVER: {
    priceId: env.STRIPE_SUBSCRIPTIONS_PLAN_ID_SILVER,
    name: "SILVER",
  },
  GOLD: {
    priceId: env.STRIPE_SUBSCRIPTIONS_PLAN_ID_GOLD,
    name: "GOLD",
  },
  DIAMOND: {
    priceId: env.STRIPE_SUBSCRIPTIONS_PLAN_ID_DIAMOND,
    name: "DIAMOND",
  },
}
