import { DataOrFail, Fail, User } from "core"
import { WebhookEvent, WebhookHandler } from "~/application/services/WebhookHandler"
import { createResponse, createResponseNoJSON } from "~/types/response-api"

export interface WebhookGateway {
  execute(eventType: WebhookEvent, user: User): Promise<DataOrFail<Fail, any>>
}

export class WebhookHTTPAdapter {
  constructor(private readonly webhookHandler: WebhookHandler) {}

  async execute(eventType: WebhookEvent, user: User) {
    const [error] = await this.webhookHandler.execute(eventType, user)
    if (error) {
      switch (error.code) {
        case "USER-PLAN-IS-ALREADY-GUEST":
          return createResponse(error.httpStatus, {
            message: "Usuário já está no plano convidado.",
          })
      }
    }

    return createResponseNoJSON(200)
  }
}

export type WebhookGatewayImpl = WebhookHTTPAdapter
