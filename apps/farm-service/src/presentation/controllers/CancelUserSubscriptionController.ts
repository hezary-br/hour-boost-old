import { CancelUserSubscriptionUseCase } from "~/application/use-cases/CancelUserSubscriptionUseCase"
import { ResponseAPI, createResponse } from "~/types/response-api"
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
        case "USER-NOT-FOUND":
          return createResponse(error.httpStatus, {
            message: `Nenhum usuário encontrado com esse email [${error.payload.givenEmail}]`,
          })
        case "ERROR-GETTING-LAST-SUBSCRIPTION":
          console.log(error)
          return createResponse(error.httpStatus, {
            message: `Não foi possível encontrar a assinatura atual.`,
          })
        // case "PLAN-NOT-FOUND":
        //   return createResponse(error.httpStatus, {
        //     message: `Nenhum plano encontrado com ID [${error.payload.givenPlanId}]`,
        //   })
        case "FAILED-TO-CANCEL-STRIPE-SUBSCRIPTION":
          console.log(error)
          return createResponse(error.httpStatus, { message: `Erro ao cancelar a assinatura.` })
        // case "COULD-NOT-PERSIST-ACCOUNT-USAGE":
        // case "LIST::COULD-NOT-RESET-FARM":
        // case "LIST::TRIMMING-ACCOUNTS":
        // case "LIST::UPDATING-CACHE":
        // console.log(error)
        // return createResponse(error.httpStatus, {
        //   message: `Assinatura cancelada! Mas aconteceu algum erro ao resetar o farm, sugerimos que você renicie manualmente o farm das contas.`,
        // })
        default:
          assertNever(error)
      }
    }

    return createResponse(200, { message: "Assinatura cancelada com sucesso.", code: result.code })
  }
}

export type CancelUserSubscriptionControllerPayload = {
  email: string
}
