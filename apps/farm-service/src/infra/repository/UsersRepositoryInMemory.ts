import { ApplicationError, type User, type UsersRepository } from "core"
import _ from "lodash"
import type { SteamAccountsInMemory } from "~/infra/repository/SteamAccountsInMemory"
import type { UsersInMemory } from "./UsersInMemory"

export class UsersRepositoryInMemory implements UsersRepository {
  constructor(
    private readonly usersMemory: UsersInMemory,
    private readonly steamAccountsMemory: SteamAccountsInMemory
  ) {}

  async dropAll(): Promise<void> {
    return this.usersMemory.dropAll()
  }

  async getByID(userId: string): Promise<User | null> {
    const user = this.usersMemory.users.find(u => u.id_user === userId)
    if (!user) return null
    for (const usage of user.plan.usages.data) {
      user.usages.add(usage)
    }
    return this.attachDBSteamAccountsToUser(user)
  }

  private attachDBSteamAccountsToUser(user: User): User {
    const steamAccountNameList = user.steamAccounts.data.map(sa => sa.credentials.accountName)
    user.steamAccounts.deleteAll()
    for (const accountName of steamAccountNameList) {
      try {
        const foundSteamAccount = this.steamAccountsMemory.getByAccountName(accountName)
        user.steamAccounts.add(foundSteamAccount)
      } catch (error) {}
    }
    return _.cloneDeep(user)
  }

  private registerSteamAccounts(user: User) {
    this.steamAccountsMemory.addIfDontExists([...user.steamAccounts.data, ...user.steamAccounts.trash])
  }

  async getByUsername(username: string): Promise<User | null> {
    return this.usersMemory.users.find(u => u.username === username) ?? null
  }

  async update(user: User): Promise<void> {
    this.registerSteamAccounts(user)
    this.steamAccountsMemory.disownSteamAccounts(user.steamAccounts.getTrashIDs())
    this.steamAccountsMemory.updateAccounts([...user.steamAccounts.data, ...user.steamAccounts.trash])
    user.steamAccounts.eraseTrash()

    const foundUserIndex = this.usersMemory.users.findIndex(u => u.id_user === user.id_user)
    if (foundUserIndex === -1)
      throw new ApplicationError(
        "Usuário não encontrado.",
        404,
        "repo em memory, tentou atualizar um usuário que não existia no banco de dados."
      )
    this.usersMemory.users[foundUserIndex] = user
  }

  async create(user: User): Promise<string> {
    this.usersMemory.users.push(user)
    return user.id_user
  }

  async findMany(): Promise<User[]> {
    return this.usersMemory.users
  }
}
