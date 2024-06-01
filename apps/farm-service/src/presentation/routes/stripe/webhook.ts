import { Router } from "express"
import express from "express"
import Stripe from "stripe"
import { ALS_username, ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { env } from "~/env"
import { stripe } from "~/infra/services/stripe"
import {
  changeUserPlanUseCase,
  getUserPlanUseCase,
  userApplicationService,
  usersRepository,
} from "~/presentation/instances"
import { getStripeCustomerById } from "~/presentation/routes/stripe/methods"
import { mapPlanNameByStripePriceIdKey, stripePriceIdListSchema } from "~/presentation/routes/stripe/plans"
import { upsertActualSubscription } from "~/presentation/routes/stripe/utils"

export const router_webhook: Router = Router()

router_webhook.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const body = req.body
  const signature = req.headers["stripe-signature"] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_SECRET_WEBHOOK)
  } catch (error: any) {
    ctxLog(`Webhook Error: ${error.message}`)
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  switch (event.type) {
    case "customer.subscription.deleted":
      break // TODO
    case "customer.subscription.created":
      break
    case "customer.subscription.updated":
      console.log("Handling webhook event: ", event.type)
      const stripePriceIdParse = stripePriceIdListSchema.safeParse(event.data.object.items.data[0]?.price.id) // TODO
      if (!stripePriceIdParse.success) return res.status(400).send("PriceId desconhecido.")
      const stripeCustomerId = event.data.object.customer as string
      const id_subscription = event.data.object.id as string
      const stripeStatus = event.data.object.status
      let { user_email } = event.data.object.metadata
      const stripePriceId = stripePriceIdParse.data

      if (!user_email) {
        const customer = await getStripeCustomerById(stripe, stripeCustomerId)
        if (!customer?.email) {
          console.log("NSTH: There is no user email, neither on the customer Id, and the metadata.")
          return res.sendStatus(500)
        }
        user_email = customer.email
      }

      const user = await usersRepository.getByEmail(user_email)
      if (!user) return res.sendStatus(404)
      await ALS_username.run(user.username, async () => {
        const [errorUpserting, actualSubscription] = await upsertActualSubscription({
          id_subscription,
          stripeCustomerId,
          stripePriceId,
          stripeStatus,
          user_email,
        })

        if (errorUpserting) {
          ctxLog(errorUpserting)
          return res.sendStatus(errorUpserting.httpStatus)
        }

        const newPlanName = mapPlanNameByStripePriceIdKey[stripePriceId]!
        const currentPlan = await userApplicationService.getCurrentPlanOrNull(user.id_user)
        const isSamePlan = currentPlan?.name === newPlanName
        if (isSamePlan) return res.sendStatus(400)

        const [errorChangingPlan] = await changeUserPlanUseCase.execute_creatingByPlanName({
          newPlanName,
          user,
        })

        if (errorChangingPlan) {
          ctxLog(errorChangingPlan)
          return res.sendStatus(errorChangingPlan.httpStatus)
        }

        if (!actualSubscription.user) {
          console.log(
            "NSTH: Webhook received and tried to update user subscription of a user that was not found.",
            {
              user_email,
              actualSubscription,
              user,
            }
          )
          return res.sendStatus(404)
        }
      })
      break
    default:
  }

  return res.sendStatus(200)
})
