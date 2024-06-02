import { Fail, User } from "core"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { RollbackToGuestPlanUseCase } from "~/application/use-cases/RollbackToGuestPlanUseCase"
import { mapPlanNameByStripePriceIdKey } from "~/presentation/routes/stripe/plans"
import { upsertActualSubscription } from "~/presentation/routes/stripe/utils"
import { assertNever } from "~/utils/assertNever"
import { bad, nice } from "~/utils/helpers"

export class WebhookHandler {
  constructor(
    private readonly rollbackToGuestPlanUseCase: RollbackToGuestPlanUseCase,
    private readonly changeUserPlanUseCase: ChangeUserPlanUseCase
  ) {}

  private async handleCancellation({ user }: Handle<NSWebhook.WebhookEventCancellation>) {
    const currentPlanIsGuest = user.plan.name === "GUEST"
    if (currentPlanIsGuest) return bad(Fail.create("USER-PLAN-IS-ALREADY-GUEST", 400))

    const [failRollingBack] = await this.rollbackToGuestPlanUseCase.execute({ user })
    if (failRollingBack) {
      ctxLog(`NSTH: Fail while rolling back from [${user.plan.name}] to guest plan GUEST.`, {
        failRollingBack,
      })
    }

    ctxLog(`Success: Rolled back plan from [${user.plan.name}] to GUEST`)
    return nice()
  }

  private async handleCreated({ user, webhookData }: Handle<NSWebhook.WebhookEventCreated>) {
    return await this.handleUpdated({ user, webhookData })
  }

  private async handleUpdated({ user, webhookData }: Handle<NSWebhook.WebhookEventUpdated>) {
    const [errorUpserting, actualSubscription] = await upsertActualSubscription({
      id_subscription: webhookData.subscriptionId,
      stripeCustomerId: webhookData.customerId,
      stripePriceId: webhookData.priceId,
      stripeStatus: webhookData.status,
      user_email: webhookData["metadata.user_email"],
    })

    if (errorUpserting) return bad(errorUpserting)

    const newPlanName = mapPlanNameByStripePriceIdKey[webhookData.priceId]
    const isSamePlan = user.plan.name === newPlanName
    if (isSamePlan) return bad(Fail.create("TRIED-UPDATING-TO-PLAN-USER-ALREADY-HAS", 400))

    const [errorChangingPlan] = await this.changeUserPlanUseCase.execute_creatingByPlanName({
      newPlanName,
      user,
    })

    if (errorChangingPlan) return bad(errorChangingPlan)

    if (!actualSubscription.user) {
      const data = { user_email: webhookData["metadata.user_email"], actualSubscription, user }
      console.log(
        "NSTH: Webhook received and tried to update user subscription of a user that was not found.",
        data
      )
      return bad(Fail.create("SUBSCRIPTION-NOT-ATTACHED-TO-ANY-USER", 404, data))
    }
    return nice()
  }

  async execute(webhook: EventMapping, user: User) {
    if (webhook.type === "cancellation")
      return await this.handleCancellation({ user, webhookData: webhook.data })
    if (webhook.type === "updated") return await this.handleUpdated({ user, webhookData: webhook.data })
    if (webhook.type === "created") return await this.handleCreated({ user, webhookData: webhook.data })
    if (webhook.type === "unknown") return bad(Fail.create("UNHANDLED-EVENT", 400))
    assertNever(webhook)
  }
}

export type EventMapping =
  | WebhookEventUpdatedMapping
  | WebhookEventCreatedMapping
  | WebhookEventCancellationMapping
  | WebhookEventUnknownMapping

export type WebhookEventUpdatedMapping = {
  type: "updated"
  data: NSWebhook.WebhookEventUpdated
}

export type WebhookEventCreatedMapping = {
  type: "created"
  data: NSWebhook.WebhookEventCreated
}

export type WebhookEventCancellationMapping = {
  type: "cancellation"
  data: NSWebhook.WebhookEventCancellation
}

export type WebhookEventUnknownMapping = {
  type: "unknown"
}

type Handle<WD> = {
  user: User
  webhookData: WD
}

export namespace NSWebhook {
  export interface WebhookEventUpdated {
    subscriptionId: string
    customerId: string
    priceId: string
    status: string
    "metadata.user_email": string
  }

  export type WebhookEventCreated = WebhookEventUpdated

  export interface WebhookEventCancellation {}
}
