import { BadgePlanType } from "@/components/layouts/UserPlanStatus/components"
import { getPlanNameCheckIfCustom } from "@/util/getPlanName"
import { IPurchasePayloadTransactionPlan } from "core"
import React from "react"
import { twc } from "react-twc"

export type PurchasePayloadTransactionPlanProps = React.ComponentPropsWithoutRef<typeof PayloadBase> & {
  payload: IPurchasePayloadTransactionPlan
}

export const PurchasePayloadTransactionPlan = React.forwardRef<
  React.ElementRef<typeof PayloadBase>,
  PurchasePayloadTransactionPlanProps
>(function PurchasePayloadTransactionPlanComponent({ payload, ...props }, ref) {
  const { from, to } = payload

  // TO-DO
  const fromPlanName = getPlanNameCheckIfCustom(from.planType, false)
  const toPlanName = getPlanNameCheckIfCustom(to.planType, false)

  return (
    <>
      <BadgePlanType
        className="flex h-5 items-center text-sm/none"
        name={from.planType}
      >
        {fromPlanName}
      </BadgePlanType>
      <span className="px-2 font-medium">→</span>
      <BadgePlanType
        className="flex h-5 items-center text-sm/none"
        name={to.planType}
      >
        {toPlanName}
      </BadgePlanType>
    </>
  )
})

PurchasePayloadTransactionPlan.displayName = "PurchasePayloadTransactionPlan"

export const PayloadBase = twc.div`flex`
