import type { PlanAllNames } from "core"
import { env } from "~/env"

export type AppStripePlan<TName extends PlanAllNames = PlanAllNames> = {
  priceId: string
  name: TName
}

export const appStripePlansPlanNameKey: {
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

export const appStripePlansPriceIdKey: {
  [K: string]: PlanAllNames
} = {
  [env.STRIPE_SUBSCRIPTIONS_PLAN_ID_GUEST]: "GUEST",
  [env.STRIPE_SUBSCRIPTIONS_PLAN_ID_SILVER]: "SILVER",
  [env.STRIPE_SUBSCRIPTIONS_PLAN_ID_GOLD]: "GOLD",
  [env.STRIPE_SUBSCRIPTIONS_PLAN_ID_DIAMOND]: "DIAMOND",
}
