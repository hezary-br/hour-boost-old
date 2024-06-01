import { Fail, User } from "core"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { prisma } from "~/infra/libs"
import { mapPlanNameByStripePriceIdKey } from "~/presentation/routes/stripe/plans"
import { bad, nice } from "~/utils/helpers"

interface AppSubscriptionDTO {
  id_subscription: string
  stripeCustomerId: string
  stripePriceId: string
  stripeStatus: string
  user_email: string
}

export async function upsertActualSubscription(dto: AppSubscriptionDTO) {
  const [result] = await Promise.allSettled([
    prisma.subscriptionStripe.upsert({
      where: { user_email: dto.user_email },
      create: {
        createdAt: new Date(),
        updatedAt: new Date(),
        id_subscription: dto.id_subscription,
        stripeCustomerId: dto.stripeCustomerId,
        stripePriceId: dto.stripePriceId,
        stripeStatus: dto.stripeStatus,
        user_email: dto.user_email,
      },
      update: {
        id_subscription: dto.id_subscription,
        stripeCustomerId: dto.stripeCustomerId,
        stripePriceId: dto.stripePriceId,
        stripeStatus: dto.stripeStatus,
        updatedAt: new Date(),
      },
      include: { user: { select: { username: true } } },
    }),
  ])

  if (result.status === "rejected") {
    return bad(Fail.create("FAILED-TO-UPDATE-APP-SUBSCRIPTION", 400, { reason: result.reason }))
  }
  return nice(result.value)
}
