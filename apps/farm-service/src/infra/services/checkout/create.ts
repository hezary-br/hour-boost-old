import { PlanInfinityName } from "core"
import { gatewayPreApprovalGateway, preApprovalPlan } from "~/infra/services/checkout/Mercadopago"
import { plans } from "~/infra/services/checkout/plans"

type CreateCheckoutProps = {
  plan: PlanInfinityName
  userId: string
  email: string
}

type CreateCheckoutReturn = {
  checkoutUrl: string
}

export async function createCheckout({
  plan,
  userId,
  email,
}: CreateCheckoutProps): Promise<CreateCheckoutReturn> {
  const makePlanBody = plans[plan]
  if (!makePlanBody) throw makePlanBody
  const body = makePlanBody(userId, email)

  try {
    const response = await gatewayPreApprovalGateway.create({
      body,
    })
    return {
      checkoutUrl: response.init_point as string,
    }
  } catch (error) {
    console.log({ error })
    return {
      checkoutUrl: "?checkout=fail",
    }
  }
}
