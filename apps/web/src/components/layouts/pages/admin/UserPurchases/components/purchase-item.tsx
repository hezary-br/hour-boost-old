import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import { cn } from "@/lib/utils"
import React from "react"
import { twc } from "react-twc"
import { useUserAdminItemId } from "../../UserItemAction/context"
import { getTypeText } from "../utils/getTypeText"
import { PurchasePayload } from "./purchase-payload"

export type PurchaseItemProps = React.ComponentPropsWithoutRef<"li"> & {
  purchaseId: string
}

export const PurchaseItem = React.forwardRef<React.ElementRef<"li">, PurchaseItemProps>(
  function PurchaseItemComponent({ purchaseId, className, ...props }, ref) {
    const userId = useUserAdminItemId()
    const purchase = useUserAdminListItem(
      userId,
      user => user.purchases.find(p => p.id_Purchase === purchaseId)!
    )
    const { id_Purchase, type, valueInCents } = purchase
    const when = new Date(purchase.when)
    const typeName = getTypeText(type.name)

    const formatter = Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

    return (
      <li
        {...props}
        className={cn("flex h-12 items-center px-6", className)}
        ref={ref}
      >
        <Item className="w-[--width-id]">
          <span className="whitespace-nowrap text-sm text-slate-500">{id_Purchase.substring(0, 7)}...</span>
        </Item>
        <Separator />
        <Item className="w-[--width-type]">
          <span className="leading/none bg-accent flex h-5 items-center rounded-sm px-1.5 text-xs font-medium">
            {typeName}
          </span>
        </Item>
        <Separator />
        <Item className="w-[--width-payload]">
          <PurchasePayload purchase={purchase} />
        </Item>
        <Separator />
        <Item className="w-[--width-when]">
          <span className="flex items-center text-sm/none font-medium">
            {when.toLocaleDateString("pt-Br", { dateStyle: "medium" })}
          </span>
        </Item>
        <Separator />
        <Item className="w-[--width-value]">
          <span className="flex items-center text-sm/none font-medium tabular-nums">
            {formatter.format(valueInCents / 100)}
          </span>
        </Item>
      </li>
    )
  }
)

PurchaseItem.displayName = "PurchaseItem"

const Item = twc.div`flex items-center`
const Separator = twc.i`pl-4 mr-4 h-full border-r border-slate-900`
