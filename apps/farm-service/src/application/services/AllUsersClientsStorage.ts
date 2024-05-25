import { ApplicationError, type PlanRepository, type SteamAccountClientStateCacheRepository } from "core"
import { UserClientsStorage } from "~/application/services"
import type { SteamAccountClient } from "~/application/services/steam"
import type { FarmGamesUseCase } from "~/application/use-cases/FarmGamesUseCase"
import type { Publisher } from "~/infra/queue"
import type { SteamAccountClientBuilder } from "~/utils/builders"

type UserID = string
export class AllUsersClientsStorage {
  users: Map<UserID, UserClientsStorage> = new Map()

  constructor(
    private readonly sacBuilder: SteamAccountClientBuilder,
    private readonly sacStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly farmGamesUseCase: FarmGamesUseCase,
    private readonly planRepository: PlanRepository,
    private readonly publisher: Publisher
  ) {}

  private generateSAC({
    accountName,
    userId,
    username,
    planId,
    autoRestart,
    isRequiringSteamGuard,
  }: AddUserProps) {
    return this.sacBuilder.create({
      accountName,
      userId,
      username,
      planId,
      autoRestart,
      isRequiringSteamGuard,
    })
  }

  private generateUserClients(username: string): UserClientsStorage {
    return new UserClientsStorage(
      username,
      this.sacStateCacheRepository,
      this.farmGamesUseCase,
      this.planRepository,
      this.publisher
    )
  }

  listUsersKeys() {
    return Array.from(this.users.keys())
  }

  getOrAddSteamAccount({
    accountName,
    userId,
    username,
    planId,
    autoRestart,
    isRequiringSteamGuard,
  }: AddUserProps): SteamAccountClient {
    const userClients = this.get(userId)
    const userRegistered = !!userClients
    const foundSac = userClients?.getAccountClient(accountName)
    const userHasAccount = !!foundSac
    if (!userRegistered) {
      this.registerUser(userId, this.generateUserClients(username))
      return this.addSteamAccount(
        username,
        userId,
        this.generateSAC({ accountName, userId, username, planId, autoRestart, isRequiringSteamGuard })
      )
    }
    if (!userHasAccount) {
      return this.addSteamAccount(
        username,
        userId,
        this.generateSAC({ accountName, userId, username, planId, autoRestart, isRequiringSteamGuard })
      )
    }
    return foundSac
  }

  getOrAddSteamAccountUnsub({
    accountName,
    userId,
    username,
    planId,
    autoRestart,
    isRequiringSteamGuard,
  }: AddUserProps): [sac: SteamAccountClient, unsub: () => void] {
    const unsub = () => this.removeSteamAccount(userId, accountName)
    const userClients = this.get(userId)
    const userRegistered = !!userClients
    const sac = userClients?.getAccountClient(accountName)
    const userHasAccount = !!sac
    if (!userRegistered) {
      this.registerUser(userId, this.generateUserClients(username))
      const sac = this.addSteamAccount(
        username,
        userId,
        this.generateSAC({ accountName, userId, username, planId, autoRestart, isRequiringSteamGuard })
      )
      return [sac, unsub]
    }
    if (!userHasAccount) {
      const sac = this.addSteamAccount(
        username,
        userId,
        this.generateSAC({ accountName, userId, username, planId, autoRestart, isRequiringSteamGuard })
      )
      return [sac, unsub]
    }
    return [sac, unsub]
  }

  removeSteamAccount(userId: string, accountName: string) {
    const userSteamClients = this.getOrThrow(userId)
    userSteamClients.removeAccountClient(accountName)
  }

  addSteamAccount(
    username: string,
    userId: string,
    steamAccountClient: SteamAccountClient
  ): SteamAccountClient {
    const userClientsStorage = this.users.get(userId)
    if (!userClientsStorage) {
      const userClientsStorage = new UserClientsStorage(
        username,
        this.sacStateCacheRepository,
        this.farmGamesUseCase,
        this.planRepository,
        this.publisher
      )
      userClientsStorage.addAccountClient(steamAccountClient)
      this.registerUser(userId, userClientsStorage)
      return steamAccountClient
    }
    userClientsStorage.addAccountClient(steamAccountClient)
    return steamAccountClient
  }

  addSteamAccountFrom0({
    accountName,
    userId,
    username,
    planId,
    autoRestart,
    isRequiringSteamGuard,
  }: AddUserProps): SteamAccountClient {
    const sac = this.sacBuilder.create({
      accountName,
      userId,
      username,
      planId,
      autoRestart,
      isRequiringSteamGuard,
    })
    this.addSteamAccount(username, userId, sac)
    return sac
  }

  registerUser(userID: string, userClientsStorage: UserClientsStorage) {
    this.users.set(userID, userClientsStorage)
    return userClientsStorage
  }

  get(userId: string) {
    return this.users.get(userId) ?? null
  }

  getOrThrow(userId: string) {
    const userSteamClients = this.users.get(userId)
    if (!userSteamClients) {
      throw new ApplicationError("Esse usuário não possui contas da Steam ativas na plataforma.", 406)
    }
    return userSteamClients
  }

  getOrNull(userId: string) {
    const userSteamClients = this.users.get(userId) ?? null
    return { userSteamClients }
  }

  getAccountClient(userID: string, accountName: string) {
    const userClientsStorage = this.users.get(userID)
    if (!userClientsStorage) return null
    const steamAccountClient = userClientsStorage.getAccountClient(accountName)
    return steamAccountClient
  }

  getAccountClientOrThrow(userID: string, accountName: string) {
    const userSteamClients = this.getOrThrow(userID)
    const steamAccountClient = userSteamClients.getAccountClientOrThrow(accountName)
    return steamAccountClient
  }

  listUsers() {
    const usersIDs = {} as Record<string, Record<string, { farming: boolean }>>
    for (const [userId, client] of this.users.entries()) {
      usersIDs[userId] = client.getAccountsStatus()
    }
    return usersIDs
  }

  flushAllAccounts() {
    for (const [username] of this.users) {
      this.users.set(username, this.generateUserClients(username))
    }
  }
}

export type AddUserProps = {
  userId: string
  username: string
  accountName: string
  planId: string
  autoRestart: boolean
  isRequiringSteamGuard: boolean
}
