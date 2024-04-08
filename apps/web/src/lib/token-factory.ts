import { createTokenFactory } from "@hourboost/tokens"

export const t = createTokenFactory(process.env.TOKEN_IDENTIFICATION_HASH!)
