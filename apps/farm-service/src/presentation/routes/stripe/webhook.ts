import { Router } from "express"
import express from "express"
import Stripe from "stripe"
import { ALS_username, ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { env } from "~/env"
import { stripe } from "~/infra/services/stripe"
import {
  changeUserPlanUseCase,
  getUserPlanUseCase,
  rollbackToGuestPlanUseCase,
  userApplicationService,
  usersRepository,
} from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import { getStripeCustomerById } from "~/presentation/routes/stripe/methods"
import { mapPlanNameByStripePriceIdKey, stripePriceIdListSchema } from "~/presentation/routes/stripe/plans"
import { upsertActualSubscription } from "~/presentation/routes/stripe/utils"
import { createResponse } from "~/types/response-api"
import { bad, nice } from "~/utils/helpers"

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

  const getCurrentPlan = (userId: string) => userApplicationService.getCurrentPlanOrNull(userId)

  if (event.type === "customer.subscription.deleted") {
    const [failExtracting, eventData] = extractStripeEventData(event)
    if (failExtracting) return RequestHandlerPresenter.handle(failExtracting, res)
    const [failGettingEmail, user_email] = await getUserEmail(
      event.data.object.metadata,
      eventData.stripeCustomerId
    )
    if (failGettingEmail) return res.sendStatus(500)
    const user = await usersRepository.getByEmail(user_email)
    if (!user) return res.sendStatus(404)
    await ALS_username.run(user.username, async () => {
      const currentPlan = await getCurrentPlan(user.id_user)
      const currentPlanIsGuest = currentPlan?.name === "GUEST"
      if (currentPlanIsGuest) return res.sendStatus(200)
      const [failRollingBack] = await rollbackToGuestPlanUseCase.execute({ user })
      if (failRollingBack) {
        ctxLog(`NSTH: Fail while rolling back from [${currentPlan?.name}] to guest plan GUEST.`, {
          failRollingBack,
        })
        return res.sendStatus(500)
      }
      ctxLog(`Success: Rolled back plan from [${currentPlan?.name}] to GUEST`)
    })
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    console.log("Handling webhook event: ", event.type)
    const [fail, eventData] = extractStripeEventData(event)
    if (fail) return RequestHandlerPresenter.handle(fail, res)
    const { id_subscription, stripeCustomerId, stripePriceId, stripeStatus } = eventData
    const [error, user_email] = await getUserEmail(event.data.object.metadata, stripeCustomerId)
    if (error) return res.sendStatus(500)
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
      const currentPlan = await getCurrentPlan(user.id_user)
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
  }

  return res.sendStatus(200)
})

async function getUserEmail(metadata: Record<string, string | undefined>, customerId: string) {
  let { user_email } = metadata

  if (!user_email) {
    const customer = await getStripeCustomerById(stripe, customerId)
    if (!customer?.email) {
      console.log("NSTH: There is no user email, neither on the customer Id, and the metadata.")
      return bad(true)
    }
    user_email = customer.email
  }
  return nice(user_email)
}

function extractStripeEventData(
  event: Omit<Stripe.CustomerSubscriptionUpdatedEvent | Stripe.CustomerSubscriptionDeletedEvent, "type">
) {
  const stripePriceIdParse = stripePriceIdListSchema.safeParse(event.data.object.items.data[0]?.price.id) // TODO
  if (!stripePriceIdParse.success) {
    return bad(createResponse(400, { message: "PriceId desconhecido." }))
  }
  const stripeCustomerId = event.data.object.customer as string
  const id_subscription = event.data.object.id as string
  const stripeStatus = event.data.object.status
  const stripePriceId = stripePriceIdParse.data

  return nice({
    id_subscription,
    stripePriceId,
    stripeStatus,
    stripeCustomerId,
  })
}
