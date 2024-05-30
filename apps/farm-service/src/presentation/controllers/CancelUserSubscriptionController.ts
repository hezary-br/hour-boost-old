import { CancelUserSubscriptionUseCase } from "~/application/use-cases/CancelUserSubscriptionUseCase"
import { ResponseAPI, createResponse, createResponseNoJSON } from "~/types/response-api"
import { assertNever } from "~/utils/assertNever"

interface ICancelUserSubscriptionController {
  handle(payload: CancelUserSubscriptionControllerPayload): Promise<ResponseAPI>
}

export class CancelUserSubscriptionController implements ICancelUserSubscriptionController {
  constructor(private readonly cancelUserSubscriptionUseCase: CancelUserSubscriptionUseCase) {}

  async handle({ email }: CancelUserSubscriptionControllerPayload) {
    const [error, result] = await this.cancelUserSubscriptionUseCase.execute({
      email,
    })

    if (error) {
      switch (error.code) {
        case "STRIPE-CUSTOMER-NOT-FOUND":
          return createResponse(error.httpStatus, { message: `Nenhum customer encontrado com esse email.` })
        case "ERROR-GETTING-LAST-SUBSCRIPTION":
        case "FAILED-TO-CANCEL-STRIPE-SUBSCRIPTION":
        case "SUBSCRIPTION-NOT-FOUND":
          return createResponse(error.httpStatus, { message: `Erro ao cancelar a subscription.` })
        default:
          assertNever(error)
      }
    }

    return createResponseNoJSON(200)
  }
}

export type CancelUserSubscriptionControllerPayload = {
  email: string
}
