import type { PrismaClient } from "@prisma/client"
import type { PrettifySoft, Role, RoleName, Status, StatusName, UsersRepository } from "core"
import {
  ActiveStatus,
  AdminRole,
  ApplicationError,
  BannedStatus,
  Purchase,
  SteamAccount,
  SteamAccountCredentials,
  SteamAccountList,
  UsageList,
  User,
  UserRole,
} from "core"
import { mapDatabasePlanToDomainWithUsages } from "~/infra/mappers/databasePlanToDomain"
import { databaseUsageToDomain } from "~/infra/mappers/databaseUsageToDomain"
import { getPlanCreation, updateUser } from "~/infra/repository/UsersRepositoryUpdateMethod"
import { toPostgreSQL, toSQLDate } from "~/utils/toSQL"

export class UsersRepositoryDatabase implements UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByEmail(email: string): Promise<User | null> {
    const dbUser = await prismaGetUser(this.prisma, { email })
    return dbUser ? prismaUserToDomain(dbUser) : null
  }

  async findMany(): Promise<User[]> {
    const users = await prismaFindMany(this.prisma)
    const usersDomain = prismaUserListToDomain(users)
    return usersDomain
  }

  async dropAll(): Promise<void> {
    console.log("Você acidentalmente tentou limpar o banco de dados.")
  }
  async create(user: User): Promise<string> {
    const { id_user } = await this.prisma.user.create({
      data: {
        id_user: user.id_user,
        createdAt: new Date(),
        email: user.email,
        profilePic: user.profilePic,
        role: user.role.name,
        status: user.status.name,
        username: user.username,
        ...getPlanCreation(user.plan),
      },
    })

    return id_user
  }

  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: {
        id_user: user.id_user,
      },
      data: updateUser(user),
    })

    if (!user.plan.custom) {
      const exists = await this.prisma.customPlan_NEW.findUnique({
        where: { originalPlanId: user.plan.id_plan },
        select: { id_plan: true },
      })
      if (exists) {
        await this.prisma.customPlan_NEW.delete({ where: { originalPlanId: user.plan.id_plan } }).catch()
      }
    }

    // if (!user.plan.custom) {
    //   await this.prisma.customPlan_NEW.delete({ where: { originalPlanId: user.plan.id_plan } }).catch()
    // }

    if (user.steamAccounts.data.length > 0) {
      const VALUES = user.steamAccounts.data
        .map(sa =>
          toPostgreSQL([
            sa.ownerId,
            sa.credentials.accountName,
            toSQLDate(new Date()),
            sa.id_steamAccount,
            sa.credentials.password,
            sa.autoRelogin,
            sa.isRequiringSteamGuard,
          ])
        )
        .join(", ")
      await this.prisma.$queryRawUnsafe(`
        INSERT INTO steam_accounts ("owner_id", "accountName", "createdAt", "id_steamAccount", "password", "autoRelogin", "isRequiringSteamGuard")
        VALUES ${VALUES}
        ON CONFLICT ("accountName") DO UPDATE
        SET "owner_id" = EXCLUDED."owner_id",
            "password" = EXCLUDED."password",
            "isRequiringSteamGuard" = EXCLUDED."isRequiringSteamGuard",
            "autoRelogin" = EXCLUDED."autoRelogin";
        `)
    }
  }

  async getByID(userId: string): Promise<User | null> {
    const dbUser = await prismaGetUser(this.prisma, { userId })
    return dbUser ? prismaUserToDomain(dbUser) : null
  }

  async getByUsername(username: string): Promise<User | null> {
    const dbUser = await prismaGetUser(this.prisma, { username })
    return dbUser ? prismaUserToDomain(dbUser) : null
  }
}

export function roleFactory(role: RoleName): Role {
  if (role === "ADMIN") return new AdminRole()
  if (role === "USER") return new UserRole()
  throw new ApplicationError(`Invalid role received: ${role}`)
}

export function statusFactory(status: StatusName): Status {
  if (status === "ACTIVE") return new ActiveStatus()
  if (status === "BANNED") return new BannedStatus()
  throw new ApplicationError(`Invalid status received: ${status}`)
}

function prismaUserFindManyToUserDomain(user: PrismaFindMany[number]): User {
  const userPlan = mapDatabasePlanToDomainWithUsages(user.plan)

  const steamAccounts: SteamAccountList = new SteamAccountList({
    data: user.steamAccounts.map(sa =>
      SteamAccount.restore({
        credentials: SteamAccountCredentials.restore({
          accountName: sa.accountName,
          password: sa.password,
        }),
        id_steamAccount: sa.id_steamAccount,
        ownerId: user.id_user,
        autoRelogin: sa.autoRelogin,
        isRequiringSteamGuard: sa.isRequiringSteamGuard,
      })
    ),
  })

  return User.restore({
    email: user.email,
    id_user: user.id_user,
    username: user.username,
    plan: userPlan,
    profilePic: user.profilePic,
    purchases: user.purchases.map(p =>
      Purchase.restore({
        id_Purchase: p.id_Purchase,
      })
    ),
    role: roleFactory(user.role),
    status: statusFactory(user.status),
    steamAccounts,
    usages: new UsageList({
      data: user.usages.map(databaseUsageToDomain),
    }),
  })
}

export function prismaUserListToDomain(users: PrismaFindMany): User[] {
  return users.map(prismaUserFindManyToUserDomain)
}

export function prismaUserToDomain(dbUser: PrismaGetUser) {
  if (!dbUser) return null
  const steamAccounts: SteamAccountList = new SteamAccountList({
    data: dbUser.steamAccounts.map(sa =>
      SteamAccount.restore({
        credentials: SteamAccountCredentials.restore({
          accountName: sa.accountName,
          password: sa.password,
        }),
        id_steamAccount: sa.id_steamAccount,
        ownerId: dbUser.id_user,
        autoRelogin: sa.autoRelogin,
        isRequiringSteamGuard: sa.isRequiringSteamGuard,
      })
    ),
  })

  const userPlan = mapDatabasePlanToDomainWithUsages(dbUser.plan)

  return User.restore({
    email: dbUser.email,
    id_user: dbUser.id_user,
    plan: userPlan,
    profilePic: dbUser.profilePic,
    username: dbUser.username,
    purchases: dbUser.purchases.map(p =>
      Purchase.restore({
        id_Purchase: p.id_Purchase,
      })
    ),
    steamAccounts,
    role: roleFactory(dbUser.role),
    status: statusFactory(dbUser.status),
    usages: new UsageList({
      data: dbUser.usages.map(databaseUsageToDomain),
    }),
  })
}

export type IGetUserProps = { userId: string } | { username: string } | { email: string }
export type PrismaFindMany = Awaited<ReturnType<typeof prismaFindMany>>
export type PrismaGetUser = Awaited<ReturnType<typeof prismaGetUser>>
export type PrismaPlanWithUsages = NonNullable<PrismaGetUser>["plan"]
export type PrismaPlan = Omit<NonNullable<PrismaPlanWithUsages>, "usages"> | null
export function prismaGetUser(prisma: PrismaClient, props: IGetUserProps) {
  return prisma.user.findUnique({
    where:
      "username" in props
        ? {
            username: props.username,
          }
        : "userId" in props
          ? {
              id_user: props.userId,
            }
          : {
              email: props.email,
            },
    include: {
      plan: { include: { usages: true, customPlan: true } },
      purchases: true,
      steamAccounts: true,
      usages: true,
    },
  })
}

export function prismaFindMany(prisma: PrismaClient) {
  return prisma.user.findMany({
    include: {
      plan: { include: { usages: true, customPlan: true } },
      steamAccounts: true,
      purchases: true,
      usages: true,
    },
  })
}
