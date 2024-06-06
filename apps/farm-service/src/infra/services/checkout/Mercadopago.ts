import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from "mercadopago"
import { env } from "~/env"

const client = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
})

console.log(env.MERCADO_PAGO_ACCESS_TOKEN)

export const gatewayPreApprovalGateway = new PreApproval(client)
export const preApprovalPlan = new PreApprovalPlan(client)
