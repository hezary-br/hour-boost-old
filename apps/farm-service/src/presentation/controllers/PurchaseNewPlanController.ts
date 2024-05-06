import { PlanAllNames } from "core"
import { PurchaseNewPlanUseCase } from "~/application/use-cases/PurchaseNewPlanUseCase"
import { ResponseAPI, createResponse, createResponseNoJSON } from "~/types/response-api"

interface IPurchaseNewPlanController {
  handle(payload: PurchaseNewPlanControllerPayload): Promise<ResponseAPI>
}

export class PurchaseNewPlanController implements IPurchaseNewPlanController {
  constructor(private readonly purchaseNewPlanUseCase: PurchaseNewPlanUseCase) {}

  async handle({ planName, userId, email }: PurchaseNewPlanControllerPayload) {
    const [error] = await this.purchaseNewPlanUseCase.execute({
      planName,
      userId,
      email,
    })

    if (error) {
      switch (error.code) {
        case "USER-NOT-FOUND":
          return createResponse(404, {
            message: `Usuário com ID [${error.payload.givenUserId}], não encontrado.`,
          })
        case "ATTEMPT-TO-ASSIGN-GUEST-PLAN":
          return createResponse(error.httpStatus, { message: "Você não pode assinar o plano convidado." })
        case "ATTEMPT-TO-ASSIGN-SAME-PLAN":
          return createResponse(error.httpStatus, { message: `Você não pode assinar o mesmo plano.` })
        default:
          error satisfies never
      }
    }

    return createResponseNoJSON(200)
  }
}

export type PurchaseNewPlanControllerPayload = {
  planName: PlanAllNames
  userId: string
  email: string
}
