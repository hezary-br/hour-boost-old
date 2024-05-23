import { Fail } from "core"
import * as MP from "mercadopago"
import {
  PreApprovalResults,
  PreApprovalSearchResponse,
} from "mercadopago/dist/clients/preApproval/search/types"
import { prisma } from "~/infra/libs"
import { PreapprovalRepository } from "~/infra/repository/PreapprovalRepository"
import { mapPreapprovalDBToDomain } from "~/infra/repository/PreapprovalRepositoryDatabase"
import { gatewayPreApprovalGateway } from "~/infra/services/checkout/Mercadopago"
import { bad, nice } from "~/utils/helpers"
import { nonNullable } from "~/utils/nonNullable"

type GetAllGatewayPrepprovalsByStatusProps = {
  gatewayPreApprovalGateway: MP.PreApproval
  payerId: number | undefined
  status: "authorized" | "cancelled" | "pending"
}

export async function getAllGatewayPrepprovalsByStatus({
  payerId,
  gatewayPreApprovalGateway,
  status,
}: GetAllGatewayPrepprovalsByStatusProps) {
  const payerIdObj = payerId ? { payer_id: payerId } : undefined
  try {
    return nice(
      await gatewayPreApprovalGateway.search({
        options: {
          sort: "date_created:desc",
          limit: 100,
          status,
          ...payerIdObj,
        },
      })
    )
  } catch (error) {
    return bad(Fail.create("FAILED-TO-GET-USER-ALL-PREAPPROVALS", 400, { error }))
  }
}

export function extractPreapprovalIds(preapprovals: PreApprovalResults[]) {
  return preapprovals.map(r => r.id).filter(nonNullable)
}

type ExcludePreapprovalByIdProps = {
  allPreapprovalsId: string[]
  preapprovalId: string
}

export function excludePreapprovalById({ allPreapprovalsId, preapprovalId }: ExcludePreapprovalByIdProps) {
  return allPreapprovalsId.filter(id => id !== preapprovalId)
}

type CancelPreapprovaListGatewayProps = {
  preapprovalIdList: string[]
  gatewayPreApprovalGateway: MP.PreApproval
}

export async function cancelPreapprovaListGateway({
  preapprovalIdList,
  gatewayPreApprovalGateway,
}: CancelPreapprovaListGatewayProps) {
  const cancelmentStatus = await Promise.allSettled(
    preapprovalIdList.map(id =>
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

type CancelPreapprovaListApplicationProps = {
  preapprovalRepository: PreapprovalRepository
  preapprovalId: string
}

export async function cancelPreapprovaListApplication({
  preapprovalId,
  preapprovalRepository,
}: CancelPreapprovaListApplicationProps) {
  const preapprovalsDatabase = await prisma.preapproval.findMany({
    where: {
      status: { not: "cancelled" },
    },
  })
  const preapprovalsWithCurrent = preapprovalsDatabase.map(mapPreapprovalDBToDomain)
  const preapprovals = preapprovalsWithCurrent.filter(p => p.preapprovalId !== preapprovalId)
  const saveAllPromises = preapprovals.map(async preapproval => {
    preapproval.cancel()
    return await preapprovalRepository.save(preapproval)
  })

  const saveAllPromisesResult = await Promise.allSettled(saveAllPromises)
  return nice(saveAllPromisesResult)
}

export function unwrapGatewayPreapprovals(preapprovals: PreApprovalSearchResponse) {
  return preapprovals.results ?? []
}

type CancelPreapprovalsOnGatewayByStatusProps = {
  gatewayPreApprovalGateway: MP.PreApproval
  preapprovalId: string
  status: "authorized" | "cancelled" | "pending"
  payerId: number
}

export async function cancelPreapprovalsOnGatewayByStatus({
  preapprovalId,
  gatewayPreApprovalGateway,
  status,
  payerId,
}: CancelPreapprovalsOnGatewayByStatusProps) {
  const [errorGettingAllPreapprovals, allPreapprovals] = await getAllGatewayPrepprovalsByStatus({
    payerId,
    gatewayPreApprovalGateway,
    status,
  })
  if (status === "authorized") {
    console.log("cancelPreapprovalsOnGatewayByStatus:", { allPreapprovals })
  }
  if (errorGettingAllPreapprovals) {
    console.log(errorGettingAllPreapprovals)
    return bad(errorGettingAllPreapprovals)
  }
  const allPreapprovalsId = extractPreapprovalIds(unwrapGatewayPreapprovals(allPreapprovals))
  const filteredPreapprovals = excludePreapprovalById({
    allPreapprovalsId,
    preapprovalId,
  })
  const [errorCancelingPreapprovals] = await cancelPreapprovaListGateway({
    preapprovalIdList: filteredPreapprovals,
    gatewayPreApprovalGateway,
  })
  if (errorCancelingPreapprovals) return bad(errorCancelingPreapprovals)
  return nice()
}

export async function getAllPreapprovalButCurrent(payerId?: number) {
  return gatewayPreApprovalGateway.search({
    options: {
      sort: "date_created:desc",
      limit: 100,
      status: "authorized",
      // offset: 1, // testando, vai que ele ainda nao tinha info do pre atual
      payer_id: payerId!,
    },
  })
}

type CancelRunningPreapprovalsOnGatewayProps = {
  gatewayPreApprovalGateway: MP.PreApproval
  preapprovalId: string
  payerId: number | undefined
}

export async function cancelRunningPreapprovalsOnGateway({
  gatewayPreApprovalGateway,
  payerId,
}: CancelRunningPreapprovalsOnGatewayProps) {
  const allPreapprovalsButCurrent = await getAllPreapprovalButCurrent(payerId)
  const allPreapprovalsId = extractPreapprovalIds(unwrapGatewayPreapprovals(allPreapprovalsButCurrent))

  const [errorCancelingPreapprovals] = await cancelPreapprovaListGateway({
    preapprovalIdList: allPreapprovalsId,
    gatewayPreApprovalGateway,
  })
  if (errorCancelingPreapprovals) return bad(errorCancelingPreapprovals)
  return nice()
}

type CancelPendingPreapprovalsOnGatewayProps = {
  gatewayPreApprovalGateway: MP.PreApproval
  preapprovalId: string
  payerId: number
}

export async function cancelPendingPreapprovalsOnGateway({
  preapprovalId,
  gatewayPreApprovalGateway,
  payerId,
}: CancelPendingPreapprovalsOnGatewayProps) {
  return await cancelPreapprovalsOnGatewayByStatus({
    gatewayPreApprovalGateway,
    preapprovalId,
    status: "pending",
    payerId,
  })
}

export async function getAllGatewayPrepprovals(payerId: number) {
  const preapprovals = await gatewayPreApprovalGateway.search({
    options: {
      sort: "date_created:desc",
      limit: 100,
      payer_id: payerId!,
    },
  })

  return preapprovals.results ?? []
}
