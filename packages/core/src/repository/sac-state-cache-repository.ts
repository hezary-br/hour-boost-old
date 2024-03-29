import { AccountSteamGamesList } from "core/entity"
import { AppAccountStatus } from "core/presenters"
import { Todo } from "core/todo"
import { CacheState } from "./CacheManagement"

export interface SteamAccountClientStateCacheRepository {
  get(accountName: string): Promise<CacheState | null>
  save(state: CacheState): Promise<void>
  // delete(accountName: string): Promise<void>
  getAccountGames(accountName: string): Promise<AccountSteamGamesList | null>
  setAccountGames(accountName: string, games: AccountSteamGamesList): Promise<void>
  setRefreshToken(accountName: string, refreshToken: IRefreshToken): Promise<void>
  getRefreshToken(accountName: string): Promise<IRefreshToken | null>
  setRefreshTokenPlanId(accountName: string, planId: string): Promise<void>
  // setPlayingGames(accountName: string, gamesId: number[], planId: string, username: string): Promise<void>
  // setStagingGames(accountName: string, gamesId: number[]): Promise<void>
  init(props: InitProps): Promise<void>
  getUsersRefreshToken(): Promise<string[]>
  flushAll(): Promise<void>
  getPersona(accountName: string): Promise<SteamAccountPersonaState | null>
  setPersona(accountName: string, persona: SteamAccountPersonaState): Promise<void>
  // stopFarm(accountName: string): Promise<void>
  deleteAllEntriesFromAccount(accountName: string): Promise<void>
  // startFarm(props: NSSteamAccountClientStateCacheRepository.StartFarmProps): Promise<void>
  // setStatus({ accountName, status }: NSSteamAccountClientStateCacheRepository.SetStatusProps): Promise<void>
}

export namespace NSSteamAccountClientStateCacheRepository {
  export type StartFarmProps = {
    accountName: string
    when: Date
    initSession?: boolean
  }

  export type SetStatusProps = {
    status: AppAccountStatus
    accountName: string
  }
}

export interface SteamAccountPersonaState {
  accountName: string
  profilePictureUrl: string
}

export type InitProps = {
  accountName: string
  planId: string
  username: string
}

export interface IRefreshToken {
  refreshToken: string
  userId: string
  username: string
  planId: string
}

export class SACStateCache {
  constructor(
    readonly gamesPlaying: number[],
    public gamesStaging: number[],
    readonly accountName: string,
    readonly planId: string,
    readonly username: string,
    readonly farmStartedAt: Date | null = null,
    readonly status: AppAccountStatus
  ) {}
  isFarming() {
    return this.gamesPlaying.length > 0
  }

  updateStagingGames(newGameList: number[]) {
    this.gamesStaging = newGameList
  }

  toJSON(): Todo {
    // TODO:
    return {
      gamesPlaying: this.gamesPlaying,
      gamesStaging: this.gamesStaging,
      accountName: this.accountName,
      isFarming: this.isFarming(),
      planId: this.planId,
      username: this.username,
      farmStartedAt: this.farmStartedAt?.getTime() ?? null,
      status: this.status,
    }
  }
}
