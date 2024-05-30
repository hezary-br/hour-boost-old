import { z } from "zod"

export const planAllNamesSchema = z.enum(["DIAMOND", "GOLD", "GUEST", "SILVER"], {
  message: "Tipo de plano inválido.",
})
