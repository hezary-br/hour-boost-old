import {
  DatabaseSteamAccount,
  PlanInfinity,
  PlanUsage,
  Role,
  UserAdminPanelSession,
  UserSession,
  UserSessionShallow,
  UsersDAO,
} from "core"
import type { UsersInMemory } from "~/infra/repository"

export class UsersDAOInMemory implements UsersDAO {
  constructor(private readonly users: UsersInMemory) {}

  async getRoleByUserId(userId: string): Promise<Role | null> {
    const user = await this.getByID(userId)
    return user
      ? {
          name: user.role,
        }
      : null
  }

  async getByIDShallow(userId: string): Promise<UserSessionShallow | null> {
    const foundUser = await this.getByID(userId)
    if (!foundUser) return null
    const { steamAccounts, purchases, ...user } = foundUser
    return user
  }

  async getUsersAdminList(): Promise<UserAdminPanelSession[]> {
    const usersAdmin: UserAdminPanelSession[] = this.users.users.map(user => {
      const steamAccounts: UserAdminPanelSession["steamAccounts"] = user.steamAccounts.data.map(sa => ({
        status: "online",
        accountName: sa.credentials.accountName,
        id_steamAccount: sa.id_steamAccount,
        autoRelogin: sa.autoRelogin,
        farmedTimeInSeconds: user.plan.usages.data.reduce((acc, item) => {
          return acc + item.amountTime
        }, 0),
        games: null,
        profilePictureUrl: null,
        stagingGames: [],
        farmingGames: [],
        farmStartedAt: null,
        isRestoringConnection: false,
      }))

      const finalUser: UserAdminPanelSession = {
        id_user: user.id_user,
        plan:
          user.plan instanceof PlanUsage
            ? {
                id_plan: user.plan.id_plan,
                autoRestarter: user.plan.autoRestarter,
                maxGamesAllowed: user.plan.maxGamesAllowed,
                maxSteamAccounts: user.plan.maxSteamAccounts,
                maxUsageTime: user.plan.maxUsageTime,
                name: user.plan.name,
                type: "USAGE",
                farmUsedTime: 0,
                custom: user.plan.custom,
              }
            : {
                id_plan: user.plan.id_plan,
                autoRestarter: user.plan.autoRestarter,
                maxGamesAllowed: user.plan.maxGamesAllowed,
                maxSteamAccounts: user.plan.maxSteamAccounts,
                name: user.plan.name,
                type: "INFINITY",
                custom: user.plan.custom,
              },
        profilePicture: user.profilePic,
        purchases: [],
        role: user.role.name,
        status: user.status.name,
        steamAccounts,
        username: user.username,
      }

      return finalUser
    })
    return usersAdmin
  }

  async getUserInfoById(
    userId: string
  ): Promise<{ username: string; userId: string; plan: PlanUsage | PlanInfinity } | null> {
    const dbUser = this.users.users.find(u => u.id_user === userId)
    return dbUser
      ? {
          username: dbUser.username,
          plan: dbUser.plan,
          userId: dbUser.id_user,
        }
      : null
  }

  async getPlanId(userId: string): Promise<string | null> {
    const dbUser = this.users.users.find(u => u.id_user === userId)
    return !dbUser ? null : dbUser.plan.id_plan
  }

  async getUsername(userId: string): Promise<{ username: string } | null> {
    const dbUser = this.users.users.find(u => u.id_user === userId)
    return dbUser
      ? {
          username: dbUser.username,
        }
      : null
  }

  async getByID(userId: string): Promise<UserSession | null> {
    const foundUser = this.users.users.find(u => u.id_user === userId) ?? null

    if (!foundUser) return null

    return {
      email: foundUser.email,
      id: foundUser.id_user,
      plan:
        foundUser.plan instanceof PlanUsage
          ? {
              id_plan: foundUser.plan.id_plan,
              autoRestarter: foundUser.plan.autoRestarter,
              maxGamesAllowed: foundUser.plan.maxGamesAllowed,
              maxSteamAccounts: foundUser.plan.maxSteamAccounts,
              maxUsageTime: foundUser.plan.maxUsageTime,
              name: foundUser.plan.name,
              type: "USAGE",
              farmUsedTime: 0,
              custom: foundUser.plan.custom,
            }
          : {
              id_plan: foundUser.plan.id_plan,
              autoRestarter: foundUser.plan.autoRestarter,
              maxGamesAllowed: foundUser.plan.maxGamesAllowed,
              maxSteamAccounts: foundUser.plan.maxSteamAccounts,
              name: foundUser.plan.name,
              type: "INFINITY",
              custom: foundUser.plan.custom,
            },
      profilePic: foundUser.profilePic,
      purchases: foundUser.purchases.map(p => p.id_Purchase),
      role: foundUser.role.name,
      status: foundUser.status.name,
      steamAccounts: foundUser.steamAccounts.data.map(sa => ({
        isRestoringConnection: false,
        status: "online",
        accountName: sa.credentials.accountName,
        id_steamAccount: sa.id_steamAccount,
        autoRelogin: sa.autoRelogin,
        farmedTimeInSeconds: foundUser.plan.usages.data.reduce((acc, item) => {
          return acc + item.amountTime
        }, 0),
        games: null,
        profilePictureUrl: null,
        stagingGames: [],
        farmingGames: [],
        farmStartedAt: null,
      })),
      username: foundUser.username,
    }
  }

  async getUsersSteamAccounts(userId: string): Promise<DatabaseSteamAccount[]> {
    const user = this.users.users.find(u => u.id_user === userId) ?? null
    if (!user) return []
    return user.steamAccounts.data.map(sa => ({
      accountName: sa.credentials.accountName,
      id_steamAccount: sa.id_steamAccount,
      userId,
    }))
  }
}
