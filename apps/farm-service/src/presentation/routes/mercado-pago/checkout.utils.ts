import { PlanAllNames, PlanInfinityName, User } from "core"
import * as MP from "mercadopago"
import { PreApproval } from "mercadopago"
import { PreApprovalResults } from "mercadopago/dist/clients/preApproval/search/types"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { PreapprovalDAO } from "~/infra/dao/PreapprovalDAO"
import {
  Preapproval,
  PreapprovalRepository,
  PreapprovalStatus,
} from "~/infra/repository/PreapprovalRepository"
import {
  cancelPreapprovaListApplication,
  cancelPreapprovaListGateway,
  excludePreapprovalById,
  extractPreapprovalIds,
  getAllGatewayPrepprovals,
} from "~/presentation/routes/mercado-pago/gateway.utils"
import { bad, nice, only } from "~/utils/helpers"

type SaveNewPreapprovalProps = {
  preapprovalRepository: PreapprovalRepository
  preapproval: Preapproval
}

export async function saveNewPreapproval({ preapproval, preapprovalRepository }: SaveNewPreapprovalProps) {
  return await preapprovalRepository.saveNew(preapproval)
}

type UpdatePreapprovalProps = {
  preapprovalRepository: PreapprovalRepository
  preapproval: Preapproval
}

export async function updatePreapproval({ preapproval, preapprovalRepository }: UpdatePreapprovalProps) {
  return await preapprovalRepository.save(preapproval)
}

type GetCurrentPreapprovalProps = {
  preapprovalRepository: PreapprovalRepository
  userId: string
}

export async function getCurrentPreapprovalRepo({
  preapprovalRepository,
  userId,
}: GetCurrentPreapprovalProps) {
  return await preapprovalRepository.getCurrent(userId)
}

type GetPreviousPreapprovalIdProps = {
  preapprovalDAO: PreapprovalDAO
  preapprovalId: string
}

export async function getPreviousPreapprovalId({
  preapprovalDAO,
  preapprovalId,
}: GetPreviousPreapprovalIdProps) {
  return await preapprovalDAO.getPreviousPreapprovalId(preapprovalId)
}

type GetApplicationPreapprovalByIdProps = {
  preapprovalRepository: PreapprovalRepository
  preapprovalId: string
}

export async function getApplicationPreapprovalById({
  preapprovalId,
  preapprovalRepository,
}: GetApplicationPreapprovalByIdProps) {
  return await preapprovalRepository.getByPrepprovalId(preapprovalId)
}

type PreApprovalResponsePartial = {
  status?: string
  id?: string
}

type PreapprovalPartial = {
  status: string
  preapprovalId: string
}

export type MakePlanCommandProps = {
  preapprovalFromGateway: PreApprovalResponsePartial
  preapprovalUserCurrent: PreapprovalPartial | null
}

export function validatePlanCommand({
  preapprovalFromGateway,
  preapprovalUserCurrent,
}: MakePlanCommandProps) {
  if (
    preapprovalFromGateway.status === "cancelled" &&
    preapprovalUserCurrent?.status !== "cancelled" &&
    preapprovalUserCurrent?.preapprovalId === preapprovalFromGateway.id
  ) {
    return only("cancel")
  }
  if (
    preapprovalFromGateway.status === "authorized" &&
    preapprovalFromGateway.id !== preapprovalUserCurrent?.preapprovalId
  ) {
    return only("assign")
  }

  return only("unexpected")
}

type AssignPlanPropsCurry = {
  changeUserPlanUseCase: ChangeUserPlanUseCase
  user: User
}

export function assignPlanCurry({ user, changeUserPlanUseCase }: AssignPlanPropsCurry) {
  return async (planName: PlanAllNames) => {
    const [errorAssigning] = await changeUserPlanUseCase.execute_creatingByPlanName({
      newPlanName: planName,
      user,
      isFinalizingSession: false,
    })
    if (errorAssigning) {
      console.log(errorAssigning, { code: "FAILED-TO-ASSIGN-PLAN" })
      return bad({ status: 400, json: { code: "FAILED-TO-ASSIGN-PLAN" } })
    }

    return nice()
  }
}

type AssignNewPlanProps = {
  changeUserPlanUseCase: ChangeUserPlanUseCase
  planName: PlanInfinityName
  user: User
}

export async function assignNewPlan({ changeUserPlanUseCase, planName, user }: AssignNewPlanProps) {
  return assignPlanCurry({ changeUserPlanUseCase, user })(planName)
}

type RollbackPlanProps = {
  changeUserPlanUseCase: ChangeUserPlanUseCase
  user: User
}

export async function rollbackPlan({ changeUserPlanUseCase, user }: RollbackPlanProps) {
  return assignPlanCurry({ changeUserPlanUseCase, user })("GUEST")
}

type CalculatePreviousPreapprovalIdProps = {
  previousApplicationPreapprovalId: string | null
  userCurrentPreapprovalId: string | undefined
  isNewPreapproval: boolean
}

export function calculatePreviousPreapprovalId({
  previousApplicationPreapprovalId,
  isNewPreapproval,
  userCurrentPreapprovalId,
}: CalculatePreviousPreapprovalIdProps) {
  if (previousApplicationPreapprovalId) return previousApplicationPreapprovalId
  if (!userCurrentPreapprovalId) return null
  return isNewPreapproval ? userCurrentPreapprovalId : null
}

type GetCurrentPreapprovalGatewayByPayerIdProps = {
  gatewayPreApprovalGateway: PreApproval
  payerId: number
}

export async function getCurrentPreapprovalGatewayByPayerId({
  payerId,
  gatewayPreApprovalGateway,
}: GetCurrentPreapprovalGatewayByPayerIdProps) {
  const queryResult = await gatewayPreApprovalGateway.search({
    options: {
      limit: 1,
      payer_id: payerId,
      sort: "date_created:desc",
    },
  })

  return queryResult.results?.at(0) ?? null
}

type CreateWebhookIdProps = {
  webhookPreapprovalId: string
  userCurrentPreapprovalGatewayId: string | undefined
  userCurrentPreapprovalApplicationPreapprovalId: string | undefined
}

export function createWebhookId({
  userCurrentPreapprovalGatewayId,
  webhookPreapprovalId,
  userCurrentPreapprovalApplicationPreapprovalId,
}: CreateWebhookIdProps) {
  const isCurrent = userCurrentPreapprovalGatewayId === webhookPreapprovalId
  const isNewCurrent = isCurrent && userCurrentPreapprovalApplicationPreapprovalId !== webhookPreapprovalId
  return { isCurrent, isNewCurrent }
}

type CancelAllPreapprovalsButCurrentProps = {
  preservingPreapprovalId: string
  payerId: number
  gatewayPreApprovalGateway: MP.PreApproval
  preapprovalRepository: PreapprovalRepository
}

export async function cancelAllPreapprovalsButCurrent({
  preapprovalRepository,
  gatewayPreApprovalGateway,
  preservingPreapprovalId,
  payerId,
}: CancelAllPreapprovalsButCurrentProps) {
  const allPreapprovals: PreApprovalResults[] = await getAllGatewayPrepprovals(payerId)
  const nonCancelledPreapprovals: PreApprovalResults[] = excludeCancelledPreapprovals(allPreapprovals)
  const preapprovalIds: string[] = extractPreapprovalIds(nonCancelledPreapprovals)
  const cancellingIds: string[] = excludePreapprovalById({
    allPreapprovalsId: preapprovalIds,
    preapprovalId: preservingPreapprovalId,
  })
  const [errorGateway] = await cancelPreapprovaListGateway({
    gatewayPreApprovalGateway,
    preapprovalIdList: cancellingIds,
  })
  if (errorGateway) return bad(errorGateway)
  const [errorApp] = await cancelPreapprovaListApplication({
    preapprovalRepository,
    preapprovalId: preservingPreapprovalId,
  })
  if (errorApp) return bad(errorApp)
  return nice()
}

export function excludeCancelledPreapprovals(preapprovals: PreApprovalResults[]) {
  return preapprovals.filter(p => p.status !== "cancelled")
}

type CheckShouldPersistProps = {
  status: PreapprovalStatus
  isNewPreapproval: boolean
}

export function checkShouldPersist({
  status,
  isNewPreapproval,
}: CheckShouldPersistProps): "new-should-save" | "existing-should-update" | undefined {
  if (status === "authorized" && isNewPreapproval) return "new-should-save"
  if (!isNewPreapproval) return "existing-should-update"
}
