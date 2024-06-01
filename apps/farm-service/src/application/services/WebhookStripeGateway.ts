import { User, Fail, DataOrFail } from "core"
import Stripe from "stripe"
import { WebhookEvent, WebhookHandler } from "~/application/services/WebhookHandler"
import { bad } from "~/utils/helpers"

export interface WebhookGateway {
  execute(eventType: Stripe.Event, user: User): Promise<DataOrFail<Fail, any>>
}

export class WebhookStripeGateway implements WebhookGateway {
  constructor(private readonly webhookHandler: WebhookHandler) {}

  async execute(eventType: Stripe.Event, user: User) {
    if (eventType.type === "subscription_schedule.canceled") {
      return await this.webhookHandler.execute(new WebhookEvent("cancellation"), user)
    }

    return bad(Fail.create("UNHANDLED-EVENT", 400))
  }
}

export type WebhookGatewayImpl = WebhookStripeGateway
