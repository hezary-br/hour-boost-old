import { PlanAllNames, PlanInfinityName, User } from "core"
import { PreApprovalResponse } from "mercadopago/dist/clients/preApproval/commonTypes"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { Preapproval, PreapprovalRepository } from "~/infra/repository/PreapprovalRepository"
import { bad, nice, only } from "~/utils/helpers"

type SaveNewPreapprovalProps = {
  preapprovalRepository: PreapprovalRepository
  preapproval: Preapproval
}

export async function saveNewPreapproval({ preapproval, preapprovalRepository }: SaveNewPreapprovalProps) {
  return await preapprovalRepository.saveNew(preapproval)
}

type CheckIfPreapprovalExistsProps = {
  preapprovalRepository: PreapprovalRepository
  preapprovalId: string
}

export async function checkIfPreapprovalExists({
  preapprovalRepository,
  preapprovalId,
}: CheckIfPreapprovalExistsProps) {
  return await preapprovalRepository.checkIfExists(preapprovalId)
}

type UpdatePreapprovalProps = {
  preapprovalRepository: PreapprovalRepository
  preapproval: Preapproval
}

export async function updatePreapproval({ preapproval, preapprovalRepository }: UpdatePreapprovalProps) {
  return await preapprovalRepository.save(preapproval)
}

export type UserId = { userId: string }
export type PreapprovalId = { preapprovalId: string }
export type PreapprovalQueryId = UserId | PreapprovalId

interface PreapprovalDAO {
  getPreviousPreapprovalId(queryId: PreapprovalQueryId): Promise<string | null>
  getCurrentPreapprovalId(queryId: PreapprovalQueryId): Promise<string | null>
}

export class PreapprovalDAOMemory implements PreapprovalDAO {
  async getPreviousPreapprovalId(queryId: PreapprovalQueryId): Promise<string | null> {
    return ""
  }

  async getCurrentPreapprovalId(queryId: PreapprovalQueryId): Promise<string | null> {
    return ""
  }
}

type GetCurrentPreapprovalProps = {
  preapprovalRepository: PreapprovalRepository
  userId: string
}

export async function getCurrentPreapproval({ preapprovalRepository, userId }: GetCurrentPreapprovalProps) {
  return await preapprovalRepository.getCurrent(userId)
}

type GetPreviousPreapprovalIdProps = {
  preapprovalDAO: PreapprovalDAO
  userId: string
}

export async function getPreviousPreapprovalId({ preapprovalDAO, userId }: GetPreviousPreapprovalIdProps) {
  return await preapprovalDAO.getPreviousPreapprovalId({ userId })
}

type GetCurrentPreapprovalIdProps = {
  preapprovalDAO: PreapprovalDAO
  userId: string
}

export async function getCurrentPreapprovalId({ preapprovalDAO, userId }: GetCurrentPreapprovalIdProps) {
  return await preapprovalDAO.getCurrentPreapprovalId({ userId })
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

export type ShouldAssignPlanProps = {
  preapprovalFromGateway: PreApprovalResponse
  preapprovalUserCurrent: Preapproval | null
}

export function shouldAssignPlan({ preapprovalFromGateway, preapprovalUserCurrent }: ShouldAssignPlanProps) {}

export type MakePlanCommandProps = {
  preapprovalFromGateway: PreApprovalResponse
  preapprovalUserCurrent: Preapproval | null
}

export function validatePlanCommand({
  preapprovalFromGateway,
  preapprovalUserCurrent,
}: MakePlanCommandProps) {
  if (preapprovalFromGateway.status === "cancelled" && preapprovalUserCurrent?.status !== "cancelled")
    return only("cancel")
  if (preapprovalFromGateway.status === "authorized" && preapprovalUserCurrent?.status !== "authorized")
    return only("assign")
  return only("unexpected")
}

type AssignPlanPropsCurry = {
  changeUserPlanUseCase: ChangeUserPlanUseCase
  user: User
}

export function assignPlanCurry({ user, changeUserPlanUseCase }: AssignPlanPropsCurry) {
  return async (planName: PlanAllNames) => {
    const [errorAssigning] = await changeUserPlanUseCase.execute({
      newPlanName: planName,
      user,
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
