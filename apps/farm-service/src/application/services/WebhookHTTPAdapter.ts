import { DataOrFail, Fail, User } from "core"
import { EventMapping, WebhookHandler } from "~/application/services/WebhookHandler"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { GENERIC_ERROR_JSON, GENERIC_ERROR_STATUS } from "~/consts"
import { createResponse, createResponseNoJSON } from "~/types/response-api"

export interface WebhookGateway {
  execute(eventType: EventMapping, user: User): Promise<DataOrFail<Fail, any>>
}

export class WebhookHTTPAdapter {
  constructor(private readonly webhookHandler: WebhookHandler) {}

  async execute(eventType: EventMapping, user: User) {
    const [error] = await this.webhookHandler.execute(eventType, user)
    if (error) {
      switch (error.code) {
        case "USER-PLAN-IS-ALREADY-GUEST":
          return createResponse(error.httpStatus, {
            message: "Usuário já está no plano convidado.",
          })
        case "COULD-NOT-PERSIST-ACCOUNT-USAGE":
        case "FAILED-TO-UPDATE-APP-SUBSCRIPTION":
        case "TRIED-UPDATING-TO-PLAN-USER-ALREADY-HAS":
        case "LIST::COULD-NOT-RESET-FARM":
        case "LIST::TRIMMING-ACCOUNTS":
        case "LIST::UPDATING-CACHE":
        case "SUBSCRIPTION-NOT-ATTACHED-TO-ANY-USER":
        case "UNHANDLED-EVENT":
          ctxLog(error)
          return createResponse(GENERIC_ERROR_STATUS, GENERIC_ERROR_JSON)
      }
    }

    return createResponseNoJSON(200)
  }
}

export type WebhookGatewayImpl = WebhookHTTPAdapter
