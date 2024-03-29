import {
  AccountSteamGamesList,
  CacheState,
  type CacheStateDTO,
  type GameSession,
  type IRefreshToken,
  type InitProps,
  type SteamAccountClientStateCacheRepository,
  type SteamAccountPersonaState,
} from "core"
import type { Redis } from "ioredis"
import { Logger } from "~/utils/Logger"

export class SteamAccountClientStateCacheRedis implements SteamAccountClientStateCacheRepository {
  readonly logger: Logger
  readonly KEY_STATE = (accountName: string) => `${accountName}:state`
  readonly KEY_REFRESH_TOKEN_LIST = "*:refreshToken"
  readonly KEY_REFRESH_TOKEN = (accountName: string) => `${accountName}:refreshToken`
  readonly KEY_ACCOUNT_GAMES = (accountName: string) => `${accountName}:sac:games`
  readonly KEY_ACCOUNT_PERSONA = (accountName: string) => `${accountName}:sac:persona`

  constructor(private readonly redis: Redis) {
    this.logger = new Logger("State Redis")
  }

  async get(accountName: string): Promise<CacheState | null> {
    const key = this.KEY_STATE(accountName)
    const foundState = (await this.redis.call("JSON.GET", key, "$")) as string | null
    if (!foundState) {
      this.logger.log(`state NOT found for user ${accountName}`)
      return null
    }
    const [state] = JSON.parse(foundState) as [state: CacheStateDTO]
    return CacheState.restoreFromDTO(state)
  }

  async save(state: CacheState): Promise<void> {
    const value = JSON.stringify(state.toDTO())
    const key = this.KEY_STATE(state.accountName)
    this.logger.log(`setting state for ${state.accountName}`)
    // console.log(`REDIS COMMAND: "JSON.SET", ${key}, "$", ${value}`)
    await this.redis.call("JSON.SET", key, "$", value)
  }

  async init({ accountName, planId, username }: InitProps): Promise<void> {
    const key = this.KEY_STATE(accountName)
    const hasState = await this.redis.call("JSON.TYPE", key)
    if (!hasState) {
      this.logger.log(`account don't have state, initting ${accountName}`)
      await this.save(
        CacheState.create({
          accountName,
          planId,
          status: "online",
          username,
        })
      )
      return
    }
  }

  async getAccountGames(accountName: string): Promise<AccountSteamGamesList | null> {
    const key = this.KEY_ACCOUNT_GAMES(accountName)
    const foundGames = await this.redis.get(key)
    if (!foundGames) {
      this.logger.log(`no games found for ${accountName}`)
      return null
    }
    const games = JSON.parse(foundGames) as GameSession[]
    const accountSteamGamesList = new AccountSteamGamesList(games)
    return accountSteamGamesList
  }

  async setAccountGames(accountName: string, games: AccountSteamGamesList): Promise<void> {
    const key = this.KEY_ACCOUNT_GAMES(accountName)
    this.logger.log(`setting games for ${accountName}`)
    await this.redis.set(key, JSON.stringify(games.toJSON()))
  }

  async setRefreshToken(accountName: string, refreshToken: IRefreshToken): Promise<void> {
    this.logger.log(`set refresh token for ${accountName}`)
    const key = this.KEY_REFRESH_TOKEN(accountName)
    const value = JSON.stringify(refreshToken)
    await this.redis.call("JSON.SET", key, "$", value)
  }

  async setRefreshTokenPlanId(accountName: string, planId: string): Promise<void> {
    this.logger.log(`set refresh token's planId for ${accountName}`)
    const key = this.KEY_REFRESH_TOKEN(accountName)
    const value = JSON.stringify(planId)
    await this.redis.call("JSON.SET", key, "$.planId", value)
  }

  async getRefreshToken(accountName: string): Promise<IRefreshToken | null> {
    const key = this.KEY_REFRESH_TOKEN(accountName)
    const foundState = (await this.redis.call("JSON.GET", key, "$")) as string | null
    if (!foundState) {
      this.logger.log(`refresh token NOT found for accountName ${accountName}`)
      return null
    }
    const [refreshToken] = JSON.parse(foundState) as [refreshToken: IRefreshToken]
    return refreshToken
  }

  async getUsersRefreshToken(): Promise<string[]> {
    throw new Error("Method not implemented.")
  }

  async flushAll(): Promise<void> {
    this.logger.log("deleting all entries for in cache.")
    await this.redis.flushall()
  }

  async getPersona(accountName: string): Promise<SteamAccountPersonaState | null> {
    const key = this.KEY_ACCOUNT_PERSONA(accountName)
    const foundState = (await this.redis.call("JSON.GET", key, "$")) as string | null
    if (!foundState) return null
    const [persona] = JSON.parse(foundState) as [persona: SteamAccountPersonaState]
    return persona
  }

  async setPersona(accountName: string, persona: SteamAccountPersonaState): Promise<void> {
    const value = JSON.stringify(persona)
    const key = this.KEY_ACCOUNT_PERSONA(accountName)
    await this.redis.call("JSON.SET", key, "$", value)
  }

  async deleteAllEntriesFromAccount(accountName: string): Promise<void> {
    this.logger.log(`Deleting all entries for [${accountName}].`)
    await this.redis
      .multi()
      .call("JSON.DEL", this.KEY_STATE(accountName))
      .del(this.KEY_REFRESH_TOKEN(accountName))
      .exec()
  }
}
