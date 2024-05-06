import { MercadoPagoConfig, PreApproval } from "mercadopago"
import { env } from "~/env"

const client = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
})

console.log(env.MERCADO_PAGO_ACCESS_TOKEN)

export const preApproval = new PreApproval(client)
