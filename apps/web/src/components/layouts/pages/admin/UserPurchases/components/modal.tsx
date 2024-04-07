import { useUserAdminListItem } from "@/components/layouts/pages/admin/hooks/useUserAdminListItem"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import React, { CSSProperties } from "react"
import { useUserAdminItemId } from "../../UserItemAction/context"
import { NoPurchasesYet } from "./no-purchases-yet"
import { PurchaseItem } from "./purchase-item"
import { PurchaseListHeader } from "./purchase-list-header"

const columnsWidth = {
  "--width-id": "4.37rem",
  "--width-type": "9.37rem",
  "--width-payload": "12.5rem",
  "--width-when": "6.87rem",
  "--width-value": "6.87rem",
} as CSSProperties

export type ModalSeeUserPurchasesProps = React.ComponentPropsWithoutRef<typeof DialogContent> & {
  children: React.ReactNode
}

export const ModalSeeUserPurchases = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  ModalSeeUserPurchasesProps
>(function ModalSeeUserPurchasesComponent({ children, className, ...props }, ref) {
  const userId = useUserAdminItemId()
  const username = useUserAdminListItem(userId, user => user.username)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        {...props}
        className={cn("w-full max-w-[80rem]", className)}
        ref={ref}
      >
        <DialogHeader>
          <DialogTitle>Transações de {username}</DialogTitle>
          <DialogDescription>
            Veja o histórico de compras, assinaturas e transações que <strong>{username}</strong> fez na
            Hourboost.
          </DialogDescription>
          <div
            className="pt-6"
            style={columnsWidth}
          >
            <PurchaseListHeader />
            <ul className="flex min-h-[50vh] flex-col gap-[2px] rounded-[8px] bg-slate-900 p-[2px]">
              <PurchasesList />
            </ul>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
})

ModalSeeUserPurchases.displayName = "ModalSeeUserPurchases"

type PurchasesListProps = {}

export const PurchasesList = React.memo(({}: PurchasesListProps) => {
  const userId = useUserAdminItemId()
  const purchaseIdList = useUserAdminListItem(userId, user => user.purchases.map(p => p.id_Purchase))

  if (purchaseIdList.length === 0) return <NoPurchasesYet />

  return purchaseIdList.map(purchaseId => (
    <PurchaseItem
      key={purchaseId}
      purchaseId={purchaseId}
      className="rounded-[6px] bg-slate-950"
    />
  ))
})
