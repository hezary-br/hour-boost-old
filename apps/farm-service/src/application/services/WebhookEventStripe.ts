import { safer } from "@hourboost/utils"
import { GetResult } from "core"
import Stripe from "stripe"
import { z } from "zod"
import { EventMapping, NSWebhook } from "~/application/services/WebhookHandler"
import { stripePriceIdListSchema } from "~/presentation/routes/stripe/plans"
import { createResponse } from "~/types/response-api"
import { bad, nice } from "~/utils/helpers"

export const mapStripeEventToWebhookEvent = (event: StripeKnownEvents, user_email: string): EventMapping => {
  switch (event.type) {
    case "customer.subscription.updated": {
      const data: EventData[typeof event.type] = {
        customerId: event.data.object.customer as string,
        subscriptionId: event.data.object.id as string,
        "metadata.user_email": event.data.object.metadata.user_email ?? user_email,
        priceId: event.data.object.items.data[0]?.price.id as z.infer<typeof stripePriceIdListSchema>,
        status: event.data.object.status,
      }
      return { data, type: "updated" }
    }
    case "customer.subscription.created": {
      const data: EventData[typeof event.type] = {
        customerId: event.data.object.customer as string,
        subscriptionId: event.data.object.id as string,
        "metadata.user_email": event.data.object.metadata.user_email ?? user_email,
        priceId: event.data.object.items.data[0]?.price.id as z.infer<typeof stripePriceIdListSchema>,
        status: event.data.object.status,
      }
      return { data, type: "created" }
    }
    case "customer.subscription.deleted": {
      const data: EventData[typeof event.type] = {}
      return { data, type: "cancellation" }
    }
    default:
      return { type: "unknown" }
  }
}

type EventData = {
  "customer.subscription.created": NSWebhook.WebhookEventCreated
  "customer.subscription.updated": NSWebhook.WebhookEventUpdated
  "customer.subscription.deleted": NSWebhook.WebhookEventCancellation
}

export function checkIsKnownEvent(__event: Stripe.Event) {
  const getKnownEvent = () => {
    switch (__event.type) {
      case "customer.subscription.created":
      case "customer.subscription.deleted":
      case "customer.subscription.updated":
        return __event
      default:
        throw new Error()
    }
  }
  const [, event] = safer(getKnownEvent)
  if (event) return nice(event)
  return bad(createResponse(400, { message: "Unhandled event." }))
}

export type StripeKnownEvents = GetResult<typeof checkIsKnownEvent>
export type StripeKnownEventsType = StripeKnownEvents["type"]
