import { PreApprovalResponse } from "mercadopago/dist/clients/preApproval/commonTypes"
import { gatewayPreApprovalGateway } from "~/infra/services/checkout/Mercadopago"

export type PlanInfo = PreApprovalResponse

type GetPreapprovalDataProps = {
  id: string
}

type GetPreapprovalDataReturn =
  | {
      error: true
      info: unknown
    }
  | {
      error: false
      plan: PlanInfo
    }

export async function getPreapprovalData({ id }: GetPreapprovalDataProps): Promise<GetPreapprovalDataReturn> {
  try {
    const foundPlan = await gatewayPreApprovalGateway.get({
      id,
    })

    return { error: false, plan: foundPlan }
  } catch (error) {
    console.log({ error })
    return { error: true, info: error }
  }
}
