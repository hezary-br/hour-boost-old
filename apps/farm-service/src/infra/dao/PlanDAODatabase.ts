import { PrismaClient } from "@prisma/client"
import { PlanUsage } from "core"
import { PlanDAO } from "~/infra/dao/PlanDAO"
import { ensurePlan, mapDatabasePlanToDomainWithUsages } from "~/infra/mappers/databasePlanToDomain"

export class PlanDAODatabase implements PlanDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserCurrent(userId: string) {
    const dbPlan = await this.prisma.plan.findFirst({
      where: { ownerId: userId },
      include: {
        usages: true,
        customPlan: true,
      },
    })

    if (!dbPlan) return null
    return mapDatabasePlanToDomainWithUsages(dbPlan)
  }

  async getFirstGuestPlan(userId: string): Promise<PlanUsage> {
    const [foundDBPlan] = await this.prisma.plan.findMany({
      where: { onceBelongedTo: userId, name: "GUEST" },
      orderBy: { createdAt: "asc" },
      include: { usages: true, customPlan: true },
      take: 1,
    })
    if (!foundDBPlan) {
      throw new Error(`NSTH: Usuário sem nenhum plano convidado! [${userId}]`)
    }

    const planDomain = mapDatabasePlanToDomainWithUsages(foundDBPlan)
    if (!(planDomain instanceof PlanUsage)) {
      throw new Error("NSTH: Pegou primeiro plano convidado mas instanciou em type Infinity!")
    }

    return planDomain
  }
}
