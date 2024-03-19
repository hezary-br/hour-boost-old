import type { PrismaClient } from "@prisma/client"
import type { Role, RoleName, Status, StatusName, UsersRepository } from "core"
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
import { databasePlanToDomain } from "~/infra/mappers/databasePlanToDomain"
import { databaseUsageToDomain } from "~/infra/mappers/databaseUsageToDomain"
import { getPlanCreation, updateUser } from "~/infra/repository/UsersRepositoryUpdateMethod"
import { toSQL, toSQLDate } from "~/utils/toSQL"

export class UsersRepositoryDatabase implements UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

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

    if (user.steamAccounts.data.length > 0) {
      await this.prisma.$queryRawUnsafe(`
        INSERT INTO steam_accounts (owner_id, accountName, createdAt, id_steamAccount, password, autoRelogin)
        VALUES ${user.steamAccounts.data
          .map(sa =>
            toSQL([
              sa.ownerId,
              sa.credentials.accountName,
              toSQLDate(new Date()),
              sa.id_steamAccount,
              sa.credentials.password,
              sa.autoRelogin ? 1 : 0,
            ])
          )
          .join(", ")} as new
        ON DUPLICATE KEY UPDATE
          owner_id = new.owner_id,
          password = new.password,
          autoRelogin = new.autoRelogin;
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
  const userPlan = databasePlanToDomain(user.plan)

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
      })
    ),
  })

  const userPlan = databasePlanToDomain(dbUser.plan)

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

export type IGetUserProps = { userId: string } | { username: string }
export type PrismaFindMany = Awaited<ReturnType<typeof prismaFindMany>>
export type PrismaGetUser = Awaited<ReturnType<typeof prismaGetUser>>
export type PrismaPlan = NonNullable<PrismaGetUser>["plan"]
export function prismaGetUser(prisma: PrismaClient, props: IGetUserProps) {
  return prisma.user.findUnique({
    where:
      "username" in props
        ? {
            username: props.username,
          }
        : {
            id_user: props.userId,
          },
    include: {
      plan: { include: { usages: true, customPlan: true } },
      custom_plan: { include: { usages: true } },
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
      custom_plan: { include: { usages: true } },
      steamAccounts: true,
      purchases: true,
      usages: true,
    },
  })
}
