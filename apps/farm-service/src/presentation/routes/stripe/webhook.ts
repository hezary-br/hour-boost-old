import express, { Router } from "express"
import Stripe from "stripe"
import { checkIsKnownEvent, mapStripeEventToWebhookEvent } from "~/application/services/WebhookEventStripe"
import { WebhookHTTPAdapter } from "~/application/services/WebhookHTTPAdapter"
import { WebhookHandler } from "~/application/services/WebhookHandler"
import { EAppResults } from "~/application/use-cases"
import { ALS_moduleName, ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { env } from "~/env"
import { stripe } from "~/infra/services/stripe"
import { changeUserPlanUseCase, rollbackToGuestPlanUseCase, usersRepository } from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import { getCustomerId, getUserEmail } from "~/presentation/routes/stripe/methods"

export const router_webhook: Router = Router()

router_webhook.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  return await ALS_moduleName.run("Webhook:", async () => {
    try {
      const body = req.body
      const signature = req.headers["stripe-signature"] as string

      const allEvent = stripe.webhooks.constructEvent(body, signature, env.STRIPE_SECRET_WEBHOOK)

      const [unknownEvent, event] = checkIsKnownEvent(allEvent)
      if (unknownEvent) return res.status(400).json({ message: "Unhandled event." })

      const customerRaw = event.data.object.customer
      const metadataEmail = event.data.object.metadata?.user_email
      if (!customerRaw && !metadataEmail) {
        console.log("NSTH: Stripe event with no customer.", JSON.parse(JSON.stringify(event)))
        return res.status(404).json({ message: "No customer Id found." })
      }
      const customerId = getCustomerId(customerRaw)

      const [failGettingEmail, user_email] = await getUserEmail(stripe, metadataEmail, customerId)
      if (failGettingEmail) return res.sendStatus(500)

      const user = await usersRepository.getByEmail(user_email)
      if (!user) return res.status(404).json({ code: EAppResults["USER-NOT-FOUND"] })

      const webhookHandler = new WebhookHandler(rollbackToGuestPlanUseCase, changeUserPlanUseCase)
      const webhookHTTPAdapter = new WebhookHTTPAdapter(webhookHandler)
      const eventType = mapStripeEventToWebhookEvent(event, user_email)
      const presentation = await webhookHTTPAdapter.execute(eventType, user)
      return RequestHandlerPresenter.handle(presentation, res)
    } catch (error: any) {
      ctxLog(`ERROR: ${error.message}`)
      return res.status(500).send(`Webhook Error: ${error.message}`)
    }
  })
})
