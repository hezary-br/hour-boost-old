import type { Prisma } from "@prisma/client"
import { PlanUsage, makeID, type PlanInfinity, type User } from "core"

type UpdateData = Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>
type CreateData = Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>

export function getPlanCreation(plan: PlanUsage | PlanInfinity) {
  return {
    plan: {
      create: {
        createdAt: new Date(),
        id_plan: plan.id_plan,
        name: plan.name,
        type: plan.type,
        customPlan: plan.custom
          ? {
              connectOrCreate: {
                where: { originalPlanId: plan.id_plan },
                create: {
                  createdAt: new Date(),
                  id_plan: makeID(),
                  maxGamesAllowed: plan.maxGamesAllowed,
                  maxSteamAccounts: plan.maxSteamAccounts,
                  maxUsageTime: plan instanceof PlanUsage ? plan.maxUsageTime : 0,
                  priceInCents: plan.price,
                  autoRelogin: plan.autoRestarter,
                },
              },
            }
          : undefined,
      },
    },
  } satisfies Pick<CreateData, "plan">
}

export function updateUser(user: User) {
  const plan = user.plan

  const updateWithoutPlan: UpdateData = {
    email: user.email,
    plan: {
      update: {
        //nunca atualizar, semper criar um novo e atribuir
        where: {
          ownerId: plan.ownerId,
        },
        data: {
          createdAt: new Date(),
          customPlan: plan.custom
            ? {
                upsert: {
                  where: { originalPlanId: plan.id_plan },
                  create: {
                    autoRelogin: plan.autoRestarter,
                    maxGamesAllowed: plan.maxGamesAllowed,
                    maxSteamAccounts: plan.maxSteamAccounts,
                    maxUsageTime: plan instanceof PlanUsage ? plan.maxUsageTime : 0,
                    priceInCents: plan.price,
                    createdAt: new Date(),
                    id_plan: makeID(),
                  },
                  update: {
                    autoRelogin: plan.autoRestarter,
                    maxGamesAllowed: plan.maxGamesAllowed,
                    maxSteamAccounts: plan.maxSteamAccounts,
                    maxUsageTime: plan instanceof PlanUsage ? plan.maxUsageTime : 0,
                    priceInCents: plan.price,
                  },
                },
              }
            : undefined,
          id_plan: plan.id_plan,
          name: plan.name,
          type: plan.type,
          usages: {
            connectOrCreate: plan.usages.data.map(u => ({
              where: { id_usage: u.id_usage },
              create: {
                amountTime: u.amountTime,
                createdAt: new Date(),
                id_usage: u.id_usage,
                accountName: u.accountName,
                user_id: u.user_id,
              },
            })),
          },
        },
      },
    },
    profilePic: user.profilePic,
    purchases: {
      connectOrCreate: user.purchases.map(p => ({
        where: { id_Purchase: p.id_Purchase },
        create: {
          createdAt: new Date(),
          id_Purchase: p.id_Purchase,
        },
      })),
    },
    role: user.role.name,
    status: user.status.name,
    username: user.username,
    steamAccounts: {
      disconnect: user.steamAccounts.getTrashIDs().map(id => ({ id_steamAccount: id })),
    },
  }

  return updateWithoutPlan
}
