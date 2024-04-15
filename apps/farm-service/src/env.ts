import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const makeRuntimeEnvs = () =>
  createEnv({
    server: {
      DATABASE_URL: z.string().url(),
      CLERK_SECRET_KEY: z.string().min(1),
      REDIS_UPSTASH_TLS: z.string().min(1).or(z.literal("local")),
      EXAMPLE_ACCOUNT_NAME: z.string().nullable().default(null),
      EXAMPLE_ACCOUNT_PASSWORD: z.string().nullable().default(null),
      NODE_ENV: z.enum(["DEV", "PRODUCTION", "DEBUG", "TEST"]),
      TOKEN_IDENTIFICATION_HASH: z.string().min(1),
      CLIENT_URL: z.string().url(),
      COOKIE_DOMAIN: z.string().includes("."),
      HASH_SECRET: z.string().min(1),
      PORT: z
        .string()
        .length(4)
        .transform(s => Number.parseInt(s, 10))
        .pipe(z.number()),
      ACTIONS_SECRET: z.string().min(1),
      STOP_ENDPOINT: z.string().url(),
      SECRET: z.string().min(1),
    },
    runtimeEnv: process.env,
    // runtimeEnvStrict: {
    //   DATABASE_URL: process.env.DATABASE_URL,
    //   ACTIONS_SECRET: process.env.ACTIONS_SECRET,
    //   CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    //   CLIENT_URL: process.env.CLIENT_URL,
    //   COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    //   NODE_ENV: process.env.NODE_ENV,
    //   PORT: process.env.PORT,
    //   REDIS_UPSTASH_TLS: process.env.REDIS_UPSTASH_TLS,
    //   TOKEN_IDENTIFICATION_HASH: process.env.TOKEN_IDENTIFICATION_HASH,
    // },
    emptyStringAsUndefined: true,
  })

type RuntimeEnvs = ReturnType<typeof makeRuntimeEnvs>
export const envTest: RuntimeEnvs = {
  NODE_ENV: "TEST",
  CLERK_SECRET_KEY: "test",
  DATABASE_URL: "test",
  REDIS_UPSTASH_TLS: "test",
  TOKEN_IDENTIFICATION_HASH: "test",
  CLIENT_URL: "http://localhost:3000",
  COOKIE_DOMAIN: ".hourboost.com.br",
  ACTIONS_SECRET: "test",
  EXAMPLE_ACCOUNT_NAME: "test",
  EXAMPLE_ACCOUNT_PASSWORD: "test",
  PORT: 4000,
  HASH_SECRET: "test",
  STOP_ENDPOINT: "http://localhost:4000/farm/stop/all",
  SECRET: "test",
}

export const selectedEnv = process.env.NODE_ENV === "TEST" ? envTest : makeRuntimeEnvs()
export const env = {
  ...selectedEnv,
  isDevMode() {
    return this.NODE_ENV === "DEV"
  },
  isInProduction() {
    return this.NODE_ENV === "PRODUCTION"
  },
}
