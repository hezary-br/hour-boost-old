import { DataOrFail } from "core"
import { Request } from "express"
import { RedisLimiter, RedisRateLimiter } from "~/infra/libs/redis-rate-limiter"
import { MiddlewareResponse } from "~/inline-middlewares/middleware-reponse"
import { bad, nice } from "~/utils/helpers"

export async function rateLimit(req: Request, limiter?: RedisLimiter) {
  const rateLimiter = RedisRateLimiter.getInstance({ limiter })

  if (!req.ip) {
    return bad(
      new MiddlewareResponse({
        code: "TOO-MANY-REQUESTS:NO-IP",
        json: { message: "Muitas requisições. Tente novamente mais tarde." },
        status: 429,
      })
    )
  }

  const { success } = await rateLimiter.limit(req.ip)

  if (!success) {
    return bad(
      new MiddlewareResponse({
        code: "TOO-MANY-REQUESTS:IP",
        json: { message: "Muitas requisições. Tente novamente mais tarde." },
        status: 429,
      })
    )
  }

  return nice(true)
}

rateLimit satisfies (req: Request, limiter?: RedisLimiter) => Promise<DataOrFail<MiddlewareResponse, boolean>>
