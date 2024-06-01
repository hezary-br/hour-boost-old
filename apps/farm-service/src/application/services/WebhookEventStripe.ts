import Stripe from "stripe"
import { WebhookEvent } from "~/application/services/WebhookHandler"

export const mapStripeEventToWebhookEvent = (event: Stripe.Event) => {
  switch (event.type) {
    case "subscription_schedule.canceled":
      return new WebhookEvent("cancellation")
  }
  return new WebhookEvent("unknown")
}
