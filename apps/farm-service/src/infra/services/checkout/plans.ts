import { PlanInfinityName } from "core"
import { PreApprovalRequest } from "mercadopago/dist/clients/preApproval/commonTypes"
import { PlanPayload } from "~/infra/services/checkout/metadata"

export const plans: Record<PlanInfinityName, (userId: string, email: string) => PreApprovalRequest> = {
  SILVER(userId: string, email: string) {
    return {
      reason: "SILVER",
      external_reference: PlanPayload.serialize({
        planName: "SILVER",
        userId,
      }),
      payer_email: "test_user_1534798027@testuser.com",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 12,
        currency_id: "BRL",
      },
      back_url: "https://hourboost-mercadopago.ultrahook.com",
      status: "pending",
    }
  },
  GOLD(userId: string, email: string) {
    return {
      reason: "GOLD",
      external_reference: PlanPayload.serialize({
        planName: "GOLD",
        userId,
      }),
      payer_email: "test_user_1534798027@testuser.com",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 18,
        currency_id: "BRL",
      },
      back_url: "https://hourboost-mercadopago.ultrahook.com",
      status: "pending",
    }
  },
  DIAMOND(userId: string, email: string) {
    return {
      reason: "DIAMOND",
      external_reference: PlanPayload.serialize({
        planName: "DIAMOND",
        userId,
      }),
      payer_email: "test_user_1534798027@testuser.com",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 22,
        currency_id: "BRL",
      },
      back_url: "https://hourboost-mercadopago.ultrahook.com",
      status: "pending",
    }
  },
}
