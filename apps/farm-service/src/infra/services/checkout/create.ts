import { PlanInfinityName } from "core"
import { preApproval } from "~/infra/services/checkout/Mercadopago"
import { plans } from "~/infra/services/checkout/plans"

type CreateCheckoutProps = {
  plan: PlanInfinityName
  username: string
  email: string
}

type CreateCheckoutReturn = {
  checkoutUrl: string
}

export async function createCheckout({
  plan,
  username,
  email,
}: CreateCheckoutProps): Promise<CreateCheckoutReturn> {
  const makePlanBody = plans[plan]
  if (!makePlanBody) throw makePlanBody
  const body = makePlanBody(username, email)

  try {
    const response = await preApproval.create({
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
