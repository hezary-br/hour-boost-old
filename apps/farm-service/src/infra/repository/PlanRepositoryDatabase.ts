import type { PrismaClient } from "@prisma/client"
import type { PlanInfinity, PlanRepository, PlanUsage } from "core"
import { mapDatabasePlanToDomainWithUsages } from "~/infra/mappers/databasePlanToDomain"

export class PlanRepositoryDatabase implements PlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUserId(userId: string): Promise<PlanUsage | PlanInfinity | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { ownerId: userId },
      include: { usages: true, customPlan: true },
    })

    return plan ? mapDatabasePlanToDomainWithUsages(plan) : null
  }

  async list(): Promise<(PlanUsage | PlanInfinity)[]> {
    console.log("NSTH: PlanRepository.list() = Method not implemented.")
    return [] as (PlanUsage | PlanInfinity)[]
  }

  async update(plan: PlanUsage | PlanInfinity): Promise<void> {
    await this.prisma.plan.update({
      where: { id_plan: plan.id_plan },
      data: {
        usages: {
          deleteMany: {
            id_usage: {
              in: plan.usages.getTrashIDs(),
            },
          },
          connectOrCreate: plan.usages.data.map(u => {
            return {
              where: { id_usage: u.id_usage },
              create: {
                amountTime: u.amountTime,
                createdAt: u.createdAt,
                id_usage: u.id_usage,
                accountName: u.accountName,
                user_id: u.user_id,
              },
            }
          }),
        },
      },
    })
  }

  async getById(planId: string): Promise<PlanUsage | PlanInfinity | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { id_plan: planId },
      include: { usages: true, customPlan: true },
    })

    return plan ? mapDatabasePlanToDomainWithUsages(plan) : null
  }
}
