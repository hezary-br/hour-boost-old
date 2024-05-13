import { saferAsync } from "@hourboost/utils"
import { Fail } from "core"
import * as MP from "mercadopago"
import { PreApprovalSearchResponse } from "mercadopago/dist/clients/preApproval/search/types"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"

type GetAllGatewayPrepprovalsProps = {
  gatewayPreApprovalGateway: MP.PreApproval
  payerId: number | undefined
}

export async function getAllGatewayPrepprovals({
  payerId,
  gatewayPreApprovalGateway,
}: GetAllGatewayPrepprovalsProps) {
  const payerIdObj = payerId ? { payer_id: payerId } : undefined
  try {
    return nice(
      await gatewayPreApprovalGateway.search({
        options: {
          sort: "date_created:desc",
          limit: 100,
          status: "authorized",
          offset: 1,
          ...payerIdObj,
        },
      })
    )
  } catch (error) {
    return bad(Fail.create("FAILED-TO-GET-USER-ALL-PREAPPROVALS", 400, { error }))
  }
}

type GetPreapprovalIdsProps = {
  allPreapprovals: PreApprovalSearchResponse
}

export function getPreapprovalIds({ allPreapprovals }: GetPreapprovalIdsProps) {
  return allPreapprovals.results?.map(r => r.id).filter(nonNullable) ?? []
}

type ExcludePreapprovalByIdProps = {
  allPreapprovalsId: string[]
  preapprovalId: string
}

export function excludePreapprovalById({ allPreapprovalsId, preapprovalId }: ExcludePreapprovalByIdProps) {
  return allPreapprovalsId.filter(id => id !== preapprovalId)
}

type CancelPreapprovaListProps = {
  filteredPreapprovals: string[]
  gatewayPreApprovalGateway: MP.PreApproval
}

export async function cancelPreapprovaList({
  filteredPreapprovals,
  gatewayPreApprovalGateway,
}: CancelPreapprovaListProps) {
  const cancelmentStatus = await Promise.allSettled(
    filteredPreapprovals.map(id =>
      gatewayPreApprovalGateway.update({
        body: { status: "cancelled" },
        id,
      })
    )
  )
  const failedOperations = cancelmentStatus.filter(op => op.status === "rejected")
  if (failedOperations.length > 0)
    return bad(Fail.create("LIST::FAILED-TO-CANCEL-OLD-PLANS", 400, { failedOperations }))
  return nice()
}

type CancelRunningPreapprovalsOnGatewayProps = {
  gatewayPreApprovalGateway: MP.PreApproval
  preapprovalId: string
  payerId: number | undefined
}

export async function cancelRunningPreapprovalsOnGateway({
  preapprovalId,
  gatewayPreApprovalGateway,
}: CancelRunningPreapprovalsOnGatewayProps) {
  const [errorGettingAllPreapprovals, allPreapprovals] = await getAllGatewayPrepprovals({
    payerId: 1807234049,
    gatewayPreApprovalGateway,
  })
  if (errorGettingAllPreapprovals) return bad(errorGettingAllPreapprovals)
  const allPreapprovalsId = getPreapprovalIds({ allPreapprovals })
  const filteredPreapprovals = excludePreapprovalById({
    allPreapprovalsId,
    preapprovalId,
  })
  const [errorCancelingPreapprovals] = await cancelPreapprovaList({
    filteredPreapprovals,
    gatewayPreApprovalGateway,
  })
  if (errorCancelingPreapprovals) return bad(errorCancelingPreapprovals)
  return nice()
}
