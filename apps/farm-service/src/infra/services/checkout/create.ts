import { Fail, PlanInfinityName, bad, nice } from "core"
import { gatewayPreApprovalGateway } from "~/infra/services/checkout/Mercadopago"
import { plans } from "~/infra/services/checkout/plans"

type CreateCheckoutProps = {
  plan: PlanInfinityName
  userId: string
  email: string
}

export async function createCheckout({ plan, userId, email }: CreateCheckoutProps) {
  const makePlanBody = plans[plan]
  if (!makePlanBody) throw makePlanBody
  const body = makePlanBody(userId, email)

  try {
    const response = await gatewayPreApprovalGateway.create({
      body,
    })
    return nice({
      checkoutUrl: response.init_point as string,
    })
  } catch (error) {
    console.log({ error })
    return bad(
      Fail.create("FAILED-TO-CREATE-CHECKOUT-SESSION", 400, {
        // @ts-expect-error
        errorMessage: "message" in error ? error.message : "Unknown error.",
      })
    )
  }
}
