import type { PrismaClient } from "@prisma/client"
import {
  type DatabaseSteamAccount,
  type GameSession,
  type Persona,
  PlanInfinity,
  type PlanRepository,
  PlanUsage,
  type PurchaseSession,
  type SteamAccountClientStateCacheRepository,
  type SteamAccountSession,
  type Usage,
  type UserAdminPanelSession,
  type UserSession,
  type UserSessionShallow,
  type UsersDAO,
} from "core"
import type { AllUsersClientsStorage, UsersSACsFarmingClusterStorage } from "~/application/services"
import type { GetPersonaStateUseCase } from "~/application/use-cases/GetPersonaStateUseCase"
import type { GetUserSteamGamesUseCase } from "~/application/use-cases/GetUserSteamGamesUseCase"
import { databasePlanToDomain } from "~/infra/mappers/databasePlanToDomain"
import { databaseUsageToDomain } from "~/infra/mappers/databaseUsageToDomain"
import { domainPlanToSession } from "~/infra/mappers/domainPlanToSession"
import { __recoveringAccounts } from "~/momentarily"

export class UsersDAODatabase implements UsersDAO {
  steamAccountFromDatabaseToSession: SteamAccountFromDatabaseToSession

  constructor(
    private readonly prisma: PrismaClient,
    getPersonaStateUseCase: GetPersonaStateUseCase,
    getUserSteamGamesUseCase: GetUserSteamGamesUseCase,
    steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage,
    allUsersClientsStorage: AllUsersClientsStorage,
    private readonly planRepository: PlanRepository
  ) {
    this.steamAccountFromDatabaseToSession = makeSteamAccountFromDatabaseToSession(
      getPersonaStateUseCase,
      getUserSteamGamesUseCase,
      allUsersClientsStorage,
      steamAccountClientStateCacheRepository
    )
  }

  async getRoleByUserId(userId: string) {
    const userRole = await this.prisma.user.findUnique({
      where: { id_user: userId },
      select: { role: true },
    })

    if (!userRole) return null
    const { role } = userRole

    return {
      name: role,
    }
  }

  async getByIDShallow(userId: string): Promise<UserSessionShallow | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id_user: userId },
      include: {
        plan: { include: { usages: true, customPlan: true } },
        purchases: { select: { id_Purchase: true } },
        steamAccounts: {
          select: {
            id_steamAccount: true,
            accountName: true,
            autoRelogin: true,
            usage: true,
          },
        },
      },
    })

    if (!dbUser) return null

    const planDomain = databasePlanToDomain(dbUser.plan)

    const result: UserSessionShallow = {
      email: dbUser.email,
      id: dbUser.id_user,
      plan: domainPlanToSession(planDomain),
      profilePic: dbUser.profilePic,
      role: dbUser.role,
      status: dbUser.status,
      username: dbUser.username,
    }
    return result
  }

  async getUsersAdminList(): Promise<UserAdminPanelSession[]> {
    const usersAdminListDatabase = await getUserAdminListDatabase(this.prisma)

    const finalResultPromises = usersAdminListDatabase.map(async user => {
      const plan = databasePlanToDomain(user.plan)

      const steamAccounts = await Promise.all(
        user.steamAccounts.map(async sa => {
          return this.steamAccountFromDatabaseToSession(
            {
              accountName: sa.accountName,
              id_steamAccount: sa.id_steamAccount,
              isRequiringSteamGuard: sa.isRequiringSteamGuard,
            },
            {
              id_user: user.id_user,
              id_plan: plan.id_plan,
              username: user.username,
              plan: { usages: user.plan?.usages.map(databaseUsageToDomain) ?? null },
            }
          )
        })
      )

      const result: UserAdminPanelSession = {
        id_user: user.id_user,
        username: user.username,
        plan: domainPlanToSession(plan),
        profilePicture: user.profilePic,
        purchases: user.purchases.map(map_purchasesFromDatabaseToSession),
        role: user.role,
        status: user.status,
        steamAccounts,
      }

      return result
    })

    return Promise.all(finalResultPromises)
  }

  async getUserInfoById(
    userId: string
  ): Promise<{ username: string; userId: string; plan: PlanUsage | PlanInfinity } | null> {
    const foundUser = await this.prisma.user.findUnique({
      where: { id_user: userId },
      select: {
        plan: { include: { usages: true, customPlan: true } },
        id_user: true,
        username: true,
      },
    })

    return foundUser
      ? {
          plan: databasePlanToDomain(foundUser.plan),
          userId: foundUser.id_user,
          username: foundUser.username,
        }
      : null
  }

  async getPlanId(userId: string): Promise<string | null> {
    const plan = await this.planRepository.getByUserId(userId)
    return plan?.id_plan ?? null
  }

  async getUsername(userId: string): Promise<{ username: string } | null> {
    return (
      this.prisma.user.findUnique({
        where: { id_user: userId },
        select: { username: true },
      }) ?? null
    )
  }

  async getByID(userId: string): Promise<UserSession | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id_user: userId },
      include: {
        plan: { include: { usages: true, customPlan: true } },
        purchases: { select: { id_Purchase: true } },
        steamAccounts: {
          select: {
            id_steamAccount: true,
            accountName: true,
            autoRelogin: true,
            usage: true,
            isRequiringSteamGuard: true,
          },
        },
      },
    })

    if (!dbUser) return null

    const planDomain = databasePlanToDomain(dbUser.plan)
    const plan = domainPlanToSession(planDomain)

    const steamAccounts: SteamAccountSession[] = await Promise.all(
      dbUser.steamAccounts.map(async sa => {
        return this.steamAccountFromDatabaseToSession(
          {
            accountName: sa.accountName,
            id_steamAccount: sa.id_steamAccount,
            isRequiringSteamGuard: sa.isRequiringSteamGuard,
          },
          {
            id_user: userId,
            id_plan: planDomain.id_plan,
            username: dbUser.username,
            plan: { usages: dbUser.plan?.usages.map(databaseUsageToDomain) ?? null },
          }
        )
      })
    )

    return {
      email: dbUser.email,
      id: dbUser.id_user,
      plan,
      profilePic: dbUser.profilePic,
      purchases: dbUser.purchases.map(p => p.id_Purchase),
      role: dbUser.role,
      status: dbUser.status,
      steamAccounts,
      username: dbUser.username,
    }
  }

  async getUsersSteamAccounts(userId: string): Promise<DatabaseSteamAccount[]> {
    const userSteamAccountsDatabase = await this.prisma.steamAccount.findMany({
      where: { owner_id: userId },
      select: {
        accountName: true,
        id_steamAccount: true,
      },
    })
    const userSteamAccounts: DatabaseSteamAccount[] = userSteamAccountsDatabase.map(sa => ({
      accountName: sa.accountName,
      id_steamAccount: sa.id_steamAccount,
      userId,
    }))

    return userSteamAccounts
  }
}

type DBSteamAccount = {
  accountName: string
  id_steamAccount: string
  isRequiringSteamGuard: boolean
}

type DBUser = {
  id_plan: string
  id_user: string
  username: string
  plan: {
    usages: Usage[] | null
  }
}

function makeSteamAccountFromDatabaseToSession(
  getPersonaStateUseCase: GetPersonaStateUseCase,
  getUserSteamGamesUseCase: GetUserSteamGamesUseCase,
  allUsersClientsStorage: AllUsersClientsStorage,
  steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
) {
  return async (sa: DBSteamAccount, dbUser: DBUser): Promise<SteamAccountSession> => {
    let games: GameSession[] | null
    let persona: Persona
    const [personaResponse, gamesResponse] = await Promise.all([
      getPersonaStateUseCase.execute({
        accountName: sa.accountName,
        userId: dbUser.id_user,
      }),
      getUserSteamGamesUseCase.execute({
        accountName: sa.accountName,
        userId: dbUser.id_user,
      }),
    ])
    const [gamesError, foundGames] = gamesResponse
    const [error, foundPersona] = personaResponse
    persona = error ? getDefaultPersona() : foundPersona
    games = gamesError ? null : foundGames.toJSON()
    // const [errorGettingCluster, cluster] = usersSACsFarmingClusterStorage.get(dbUser.username)
    // if (errorGettingCluster) {
    //   console.log(errorGettingCluster)
    //   throw errorGettingCluster
    // }
    // const { farmStartedAt } = cluster.getInnerState()

    const sac = allUsersClientsStorage.getAccountClient(dbUser.id_user, sa.accountName)
    if (!sac) {
      if (__recoveringAccounts.has(sa.accountName)) {
        const cache = await steamAccountClientStateCacheRepository.get(sa.accountName)
        if (!cache) throw new Error("Cache not found.")
        if (cache.status === "iddle") throw new Error("SAC state status iddle being sent to the client")
        return Promise.resolve({
          accountName: sa.accountName,
          games,
          id_steamAccount: sa.id_steamAccount,
          farmingGames: cache.gamesPlaying,
          stagingGames: cache.gamesStaging,
          farmedTimeInSeconds: 0,
          farmStartedAt: cache.farmStartedAt?.toISOString() ?? null,
          status: cache.status,
          autoRelogin: false,
          isRestoringConnection: true,
          isRequiringSteamGuard: sa.isRequiringSteamGuard,
          ...persona,
        } as const)
      }
      throw new Error(
        `Sac not found for user ${sa.accountName}, but has users: [${allUsersClientsStorage.listUsersKeys()}]`
      )
    }
    const cacheStateDTO = sac.getCache().toDTO()
    const { accountName, gamesPlaying, gamesStaging, status } = cacheStateDTO
    const farmStartedAt = cacheStateDTO.farmStartedAt
      ? new Date(cacheStateDTO.farmStartedAt).toISOString()
      : null

    const farmedTimeInSeconds = dbUser.plan.usages
      ? dbUser.plan.usages.reduce((acc, item) => {
          if (item.accountName === sa.accountName) return acc + item.amountTime
          return acc
        }, 0)
      : 0

    if (status === "iddle") throw new Error("SAC state status iddle being sent to the client")

    return Promise.resolve({
      accountName,
      games,
      id_steamAccount: sa.id_steamAccount,
      farmingGames: gamesPlaying,
      stagingGames: gamesStaging,
      farmedTimeInSeconds,
      farmStartedAt,
      status,
      autoRelogin: sac.autoRestart ?? false,
      isRestoringConnection: false,
      isRequiringSteamGuard: sa.isRequiringSteamGuard,
      ...persona,
    })
  }
}

type SteamAccountFromDatabaseToSession = ReturnType<typeof makeSteamAccountFromDatabaseToSession>

function getDefaultPersona(): Persona {
  return {
    profilePictureUrl: null,
  }
}

function map_purchasesFromDatabaseToSession(purchaseDB: UserAdminListDatabasePurchase): PurchaseSession {
  return {
    id_Purchase: purchaseDB.id_Purchase,
    type: {
      from: { planType: "GUEST" },
      name: "TRANSACTION-PLAN",
      to: { planType: "GOLD" },
    },
    valueInCents: 2000,
    when: new Date("2024-06-01T10:00:00.000Z").toISOString(),
  }
}

type UserAdminListDatabase = Awaited<ReturnType<typeof getUserAdminListDatabase>>[number]
type UserAdminListDatabasePurchase = UserAdminListDatabase["purchases"][number]

function getUserAdminListDatabase(prisma: PrismaClient) {
  return prisma.user.findMany({
    select: {
      id_user: true,
      username: true,
      role: true,
      profilePic: true,
      plan: { include: { usages: true, customPlan: true } },
      purchases: { select: { id_Purchase: true } },
      status: true,
      steamAccounts: {
        select: { id_steamAccount: true, accountName: true, isRequiringSteamGuard: true },
      },
    },
  })
}
