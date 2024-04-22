import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export const ephemeralCache = new Map()
export type RedisLimiterInterval = Parameters<typeof Ratelimit.slidingWindow>[1]
export type RedisLimiter = {
  tokens: number
  window: RedisLimiterInterval
  timeout?: number | undefined
}

export class RedisRateLimiter {
  static instance: Ratelimit
  static redisInstance: Redis

  static getRedis() {
    if (this.redisInstance) return this.redisInstance
    this.redisInstance = Redis.fromEnv()
    return this.redisInstance
  }

  static getInstance(props?: { limiter?: RedisLimiter }) {
    const upstashRedis = this.getRedis()

    if (props?.limiter)
      return new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(props.limiter.tokens, props.limiter.window),
        ephemeralCache,
        timeout: props.limiter.timeout,
      })

    if (this.instance) return this.instance

    const rateLimit = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(7, "30 s"),
      ephemeralCache,
      timeout: 1000 * 30, // 30seg
    })

    this.instance = rateLimit
    return this.instance
  }
}
