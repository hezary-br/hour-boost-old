import { createTokenFactory } from "@hourboost/tokens"
import { env } from "~/env"

export const token = createTokenFactory(env.TOKEN_IDENTIFICATION_HASH)
