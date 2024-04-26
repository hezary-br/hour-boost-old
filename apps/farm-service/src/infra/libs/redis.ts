import Redis from "ioredis"
import { env } from "~/env"

const tls = env.REDIS_UPSTASH_TLS

if (env.isInProduction()) console.log(`[Redis] Connecting to ${tls ? "production" : "local"} Redis.`)
export const redis = new Redis(tls)
