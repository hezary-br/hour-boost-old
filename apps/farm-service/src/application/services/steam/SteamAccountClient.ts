import { appendFile } from "fs"
import {
  AccountGames,
  AccountSteamGamesList,
  AppAccountStatus,
  ApplicationError,
  CacheState,
  CacheStateDTO,
  CacheStateHollow,
  DataOrFail,
  Fail,
  GameSession,
  IRefreshToken,
  SteamAccountPersonaState,
} from "core"
import SteamUser from "steam-user"
import { connection } from "~/__tests__/connection"
import type { EventEmitter } from "~/application/services"
import { Events } from "~/application/services/events"
import { LastHandler } from "~/application/services/steam"
import { getHeaderImageByGameId } from "~/consts"
import { env } from "~/env"
import type { Publisher } from "~/infra/queue"
import { areTwoArraysEqual } from "~/utils"
import { Logger } from "~/utils/Logger"
import { bad, nice } from "~/utils/helpers"

export class SteamAccountClient extends LastHandler {
  private cache: CacheState
  private readonly publisher: Publisher
  readonly logger: Logger
  readonly emitter: EventEmitter<SteamApplicationEvents>
  client: SteamUser
  userId: string
  username: string
  planId: string
  logged = false
  accountName: string
  ownershipCached = false
  autoRestart: boolean
  isRequiringSteamGuard: boolean

  restoreCacheHollowSession(props: CacheStateHollow) {
    this.cache.restoreHollow(props)
  }

  constructor({ instances, props }: SteamAccountClientProps) {
    super()
    this.userId = props.userId
    this.username = props.username
    this.client = props.client
    this.publisher = instances.publisher
    this.planId = props.planId
    this.emitter = instances.emitter
    this.autoRestart = props.autoRestart
    this.accountName = props.accountName
    this.isRequiringSteamGuard = props.isRequiringSteamGuard
    this.logger = new Logger(this.accountName)

    this.cache = CacheState.create({
      accountName: props.accountName,
      planId: props.planId,
      status: "online",
      username: props.username,
    })

    this.client.on("loggedOn", (...args) => {
      Events.emit("account_logged_in", this.userId, this.accountName, this.isRequiringSteamGuard)
      this.isRequiringSteamGuard = false

      appendFile(
        "logs/sac-loggedon.txt",
        `${new Date().toISOString()} [${this.accountName}] - ${JSON.stringify(args)} \r\n`,
        () => {}
      )
      this.emitter.emit("hasSession")
      this.getLastHandler("loggedOn")(...args)
      this.setLastArguments("loggedOn", args)
      this.logged = true
      this.logger.log("logged in.")
      this.client.setPersona(SteamUser.EPersonaState.Online)
      this.client.gamesPlayed([])
    })

    this.client.on("ownershipCached", (...args) => {
      this.logger.log(`ownershipCached!`)
      this.ownershipCached = true
      this.getLastHandler("ownershipCached")(...args)
      this.setLastArguments("ownershipCached", args)
    })

    // @ts-ignore
    this.client.on("refreshToken", async (...args: [refreshToken: string]) => {
      const [refreshToken] = args
      this.emitter.emit("gotRefreshToken", {
        refreshToken,
        userId: this.userId,
        username: this.username,
        accountName: this.accountName,
        planId: this.planId,
      })
      this.logger.log(`got refreshToken.`)
      this.getLastHandler("refreshToken")(...args)
      this.setLastArguments("refreshToken", args)
    })

    this.client.on("steamGuard", async (...args) => {
      Events.emit("account_required_steam_guard", this.userId, this.accountName)
      this.isRequiringSteamGuard = true

      const [domain] = args
      appendFile(
        "logs/sac-steam-guard.txt",
        `${new Date().toISOString()} [${this.accountName}] - ${JSON.stringify(args)} \r\n`,
        () => {}
      )
      this.logger.log("steam guard required.")
      this.getLastHandler("steamGuard")(...args)
      this.setLastArguments("steamGuard", args)
      this.changeInnerStatusToNotLogged()
      this.logger.log(
        domain
          ? `Steam Guard code needed from email ending in ${domain}`
          : `requesting Steam Guard on your device.`
      )
    })

    this.client.on("error", (...args) => {
      const [error] = args
      appendFile(
        "logs/sac-errors.txt",
        `${new Date().toISOString()} [${this.accountName}] - ${JSON.stringify(...args)} \r\n`,
        () => {}
      )
      const validEResult = !!error.eresult
      this.logger.log("22 error.", { error })
      this.logger.log("error.", { eresult: error.eresult })
      if (validEResult) {
        this.changeInnerStatusToNotLogged()
        this.emitter.emit("interrupt", this.getCache().toDTO(), error)
        this.getLastHandler("error")(...args)
        this.setLastArguments("error", args)
      }

      if (error.eresult === SteamUser.EResult.LoggedInElsewhere) {
        this.emitter.emit("logged-somewhere-else")
      }
      if (error.eresult === SteamUser.EResult.AccessDenied) {
        this.emitter.emit("access-denied", { accountName: this.accountName })
      }
    })

    this.client.on("playingState", (...args) => {
      const [blocked, appId, ...rest] = args
      this.logger.log("44: playingState >>", {
        blocked,
        appId,
        ...rest,
      })
    })

    this.client.on("disconnected", (...args) => {
      const [error] = args
      appendFile(
        "logs/sac-disconnected.txt",
        `${new Date().toISOString()} [${this.accountName}] - ${JSON.stringify(args)} \r\n`,
        () => {}
      )
      this.changeInnerStatusToNotLogged()
      this.emitter.emit("interrupt", this.getCache().toDTO(), { eresult: error })
      this.logger.log("disconnected.", ...args)
      this.getLastHandler("disconnected")(...args)
      this.setLastArguments("disconnected", args)
    })

    if (env.NODE_ENV === "TEST") {
      connection.on("break", ({ relog = true, replaceRefreshToken = false } = {}) => {
        this.logger.log(`Emitting noConnection error of user ${this.accountName} for the cluster.`)
        this.client.emit("error", { eresult: SteamUser.EResult.NoConnection })
        if (replaceRefreshToken) {
          this.emitter.emit("gotRefreshToken", {
            refreshToken: "INVALID",
            userId: this.userId,
            username: this.username,
            accountName: this.accountName,
            planId: this.planId,
          })
        }
        if (relog) {
          setTimeout(() => {
            this.client.emit("webSession")
          }, 500).unref()
        }
      })
    }

    this.client.on("webSession", async (...args) => {
      appendFile(
        "logs/sac-webSession.txt",
        `${new Date().toISOString()} [${this.accountName}] - ${JSON.stringify(args)} \r\n`,
        () => {}
      )
      this.emitter.emit("hasSession")
      this.logger.log(`Got webSession.`)
      this.getLastHandler("webSession")(...args)
      this.setLastArguments("webSession", args)
    })
  }

  getCache() {
    return this.cache
  }

  updateStagingGames(newGameList: number[]) {
    this.cache.stageGames(newGameList)
  }

  setAutoRestart(on: boolean) {
    if (this.autoRestart === on) return
    this.autoRestart = on
  }

  setFarmStartedAt(when: Date) {
    this.cache.setFarmStartedAt(when)
  }

  getGamesPlaying() {
    return this.cache.gamesPlaying
  }

  getGamesStaging() {
    return this.cache.gamesStaging
  }

  getStatus() {
    return this.cache.status
  }

  farmGames(gamesID: number[]) {
    if (this.isRequiringSteamGuard)
      return bad(Fail.create("SAC-IS-REQUIRING-STEAM-GUARD", 403, { accountName: this.accountName }))
    const userIntention = getUserFarmIntention(gamesID, this.cache.gamesPlaying)
    if (userIntention === "DIDNT-ADD-GAMES")
      return bad(Fail.create("DIDNT-ADD-GAMES", 203, { accountName: this.accountName }))

    this.cache.farmGames(gamesID)
    this.logger.log(`Calling the client with `, gamesID)
    this.client.gamesPlayed(gamesID)
    return nice()
  }

  stopFarm() {
    this.client.gamesPlayed([])
    const [error] = this.cache.stopFarm()
    if (error) return bad(error)
    return nice()
  }

  stopFarm_CLIENT_() {
    this.client.gamesPlayed([])
  }

  login(accountName: string, password: string, authCode?: string) {
    try {
      this.client.logOn({
        accountName,
        password,
        authCode,
      })
      return nice()
    } catch (e) {
      console.log("ERROR_TRYING_TO_LOGIN_IN_STEAM_CLIENT::CREDENTIALS", e)
      return bad(
        new Fail({
          code: "ERROR_TRYING_TO_LOGIN_IN_STEAM_CLIENT::CREDENTIALS",
          httpStatus: 400,
          payload: e as Error,
        })
      )
    }
  }

  loginWithToken(refreshToken: string) {
    try {
      this.client.logOn({
        refreshToken,
      })
      return nice()
    } catch (e) {
      console.log("ERROR_TRYING_TO_LOGIN_IN_STEAM_CLIENT::TOKEN", e)
      return bad(
        new Fail({
          code: "ERROR_TRYING_TO_LOGIN_IN_STEAM_CLIENT::TOKEN",
          httpStatus: 400,
          payload: e as Error,
        })
      )
    }
  }

  changeInnerStatusToNotLogged() {
    this.logged = false
  }

  logoff() {
    this.logger.log(`${this.accountName} logged off.`)
    this.emitter.emit("user-logged-off")
    this.client.logOff()
  }

  getPlayingGames() {
    return this.cache.gamesPlaying
  }

  isFarming(): boolean {
    return this.cache.isFarming()
  }

  setStatus(status: AppAccountStatus) {
    if (this.isRequiringSteamGuard)
      return bad(Fail.create("SAC-IS-REQUIRING-STEAM-GUARD", 400, { accountName: this.accountName }))
    const persona = mapStatusToPersona(status)
    this.client.setPersona(persona)
    this.cache.changeStatus(status)
    return nice()
  }

  async getAccountGamesList() {
    if (this.isRequiringSteamGuard)
      return bad(Fail.create("SAC-IS-REQUIRING-STEAM-GUARD", 400, { accountName: this.accountName }))
    if (!this.client.steamID) return [new ApplicationError("No steam id set.")] as const
    const { apps } = (await this.client.getUserOwnedApps(this.client.steamID)) as unknown as AccountGames
    const games: GameSession[] = apps.map(game => ({
      id: game.appid,
      imageUrl: getHeaderImageByGameId(game.appid),
      name: game.name ?? "unnamed game",
    }))
    const userSteamGames = new AccountSteamGamesList(games)
    return [null, userSteamGames] as const
  }

  async getAccountPersona() {
    if (this.isRequiringSteamGuard)
      return bad(Fail.create("SAC-IS-REQUIRING-STEAM-GUARD", 400, { accountName: this.accountName }))
    const steamId = this.client.steamID?.toString()
    if (!steamId) return bad(Fail.create("NO_STEAM_ID_FOUND", 400, { steamId }))

    const [error, persona] = await new Promise<
      DataOrFail<
        Fail<"CLIENT_ERROR_GETTING_PERSONA", 400, { clientError: Error | null }>,
        Record<string, any>
      >
    >(resolve => {
      this.client.getPersonas([steamId], (error, personas) => {
        const errorArgs = ["CLIENT_ERROR_GETTING_PERSONA", 400, { clientError: error }] as const
        if (error) {
          console.log("NSTH: ", errorArgs)
          resolve(bad(Fail.create(...errorArgs)))
        }
        resolve(nice(personas[steamId]))
      })
    })

    if (error) return bad(error)

    const personaState: SteamAccountPersonaState = {
      accountName: this.accountName,
      profilePictureUrl: persona["avatar_url_medium"],
    }

    return nice(personaState)
  }
}

function getUserFarmIntention(gamesID: number[], currentFarmingGames: number[]) {
  if (gamesID.length > 0 && currentFarmingGames.length === 0) return "START-FARMING"
  if (gamesID.length === 0) return "STOP-FARMING"
  if (areTwoArraysEqual(gamesID, currentFarmingGames)) return "DIDNT-ADD-GAMES"
  if (gamesID.length === currentFarmingGames.length && !areTwoArraysEqual(gamesID, currentFarmingGames))
    return "ADD-GAMES"
  if (gamesID.length > currentFarmingGames.length) return "ADD-GAMES"
  if (gamesID.length < currentFarmingGames.length) return "REMOVE-GAMES"
  console.log({ gamesID, currentFarmingGames })
  throw new ApplicationError("Server wasn't able to understand user intention.")
}

export type SteamAccountClientProps = {
  props: {
    userId: string
    username: string
    client: SteamUser
    accountName: string
    planId: string
    autoRestart: boolean
    farmStartedAt?: Date | null
    isRequiringSteamGuard: boolean
  }
  instances: {
    publisher: Publisher
    emitter: EventEmitter<SteamApplicationEvents>
  }
}

export type OnEventReturn = {
  message: string
  status: number
}

export type SteamApplicationEvents = {
  interrupt: [cacheStateDTO: CacheStateDTO, error: { eresult: number }]
  hasSession: []
  "relog-with-state": [cacheState: CacheStateDTO]
  relog: []
  gotRefreshToken: [refreshTokenInterface: IRefreshToken & { accountName: string }]
  "user-logged-off": []
  "logged-somewhere-else": []
  "access-denied": [props: { accountName: string }]
}

export class CacheStateFactory {
  static createDTO(props: NSCacheStateFactory.CreateDTOProps): CacheStateDTO {
    return {
      accountName: props.accountName,
      gamesPlaying: props.gamesPlaying,
      gamesStaging: props.gamesStaging,
      isFarming: props.isFarming,
      planId: props.planId,
      username: props.username,
      farmStartedAt: props.farmStartedAt?.getTime() ?? null,
      status: props.status,
    }
  }
}

export namespace NSCacheStateFactory {
  export type CreateDTO_SAC_Props = {
    accountName: string
    gamesPlaying: number[]
    gamesStaging: number[]
    isFarming: boolean
    planId: string
    username: string
    status: AppAccountStatus
  }

  export type CreateDTOClusterProps = {
    farmStartedAt: Date | null
  }

  export type CreateDTOProps = CreateDTO_SAC_Props & CreateDTOClusterProps
}

function mapStatusToPersona(status: AppAccountStatus): SteamUser.EPersonaState {
  const mapping: Record<AppAccountStatus, SteamUser.EPersonaState> = {
    offline: SteamUser.EPersonaState.Offline,
    online: SteamUser.EPersonaState.Online,
  }

  return mapping[status]
}
