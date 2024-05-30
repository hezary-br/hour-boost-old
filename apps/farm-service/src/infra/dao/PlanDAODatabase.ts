import { PrismaClient } from "@prisma/client"
import { PlanUsage } from "core"
import { PlanDAO } from "~/infra/dao/PlanDAO"
import { mapDatabasePlanToDomainWithUsages } from "~/infra/mappers/databasePlanToDomain"

export class PlanDAODatabase implements PlanDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async getFirstGuestPlan(userId: string): Promise<PlanUsage> {
    const [foundDBPlan] = await this.prisma.plan.findMany({
      where: { ownerId: userId, name: "GUEST" },
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
