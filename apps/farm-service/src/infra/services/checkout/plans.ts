import { PlanInfinityName } from "core"
import { PreApprovalRequest } from "mercadopago/dist/clients/preApproval/commonTypes"
import { env } from "~/env"
import { PlanPayload } from "~/infra/services/checkout/metadata"

export const plans: Record<PlanInfinityName, (userId: string, email: string) => PreApprovalRequest> = {
  SILVER(userId: string, email: string) {
    return {
      reason: "Plano Silver",
      external_reference: PlanPayload.serialize({
        planName: "SILVER",
        userId,
        userEmail: email,
      }),
      payer_email: env.MERCADO_PAGO_TEST_USER_EMAIL ?? email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 12,
        currency_id: "BRL",
      },
      back_url: "https://hourboost-api.ultrahook.com",
      status: "pending",
    }
  },
  GOLD(userId: string, email: string) {
    return {
      reason: "Plano Gold",
      external_reference: PlanPayload.serialize({
        planName: "GOLD",
        userId,
        userEmail: email,
      }),
      payer_email: env.MERCADO_PAGO_TEST_USER_EMAIL ?? email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 18,
        currency_id: "BRL",
      },
      back_url: "https://hourboost-api.ultrahook.com",
      status: "pending",
    }
  },
  DIAMOND(userId: string, email: string) {
    return {
      reason: "Plano Diamond",
      external_reference: PlanPayload.serialize({
        planName: "DIAMOND",
        userId,
        userEmail: email,
      }),
      payer_email: env.MERCADO_PAGO_TEST_USER_EMAIL ?? email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 22,
        currency_id: "BRL",
      },
      back_url: "https://hourboost-api.ultrahook.com",
      status: "pending",
    }
  },
}
