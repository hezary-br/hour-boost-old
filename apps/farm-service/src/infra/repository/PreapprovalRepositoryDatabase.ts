import { PrismaClient } from "@prisma/client"
import {
  Preapproval,
  PreapprovalProps,
  PreapprovalRepository,
  PreapprovalRepositoryListFilter,
  preapprovalPlanNameSchema,
  preapprovalStatusSchema,
} from "~/infra/repository/PreapprovalRepository"

export class PreapprovalRepositoryDatabase implements PreapprovalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(filter?: PreapprovalRepositoryListFilter | undefined): Promise<Preapproval[]> {
    if (filter?.idList) {
      const preapprovals = await this.prisma.preapproval.findMany({
        where: { id_preapproval: { in: filter.idList } },
      })
      return preapprovals.map(mapPreapprovalDBToDomain)
    }
    const preapprovals = await this.prisma.preapproval.findMany({
      take: filter?.limit,
    })

    return preapprovals.map(mapPreapprovalDBToDomain)
  }

  async getCurrent(userId: string): Promise<Preapproval | null> {
    const preapprovalDb = await this.prisma.preapproval.findFirst({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
    })

    if (!preapprovalDb) return null

    return new Preapproval(mapPreapprovalDBToDomain(preapprovalDb))
  }

  async saveNew(preapproval: Preapproval): Promise<void> {
    const create = () =>
      this.prisma.preapproval.create({
        data: {
          createdAt: preapproval.createdAt,
          id_preapproval: preapproval.preapprovalId,
          planName: preapproval.planName,
          status: preapproval.status,
          payerId: preapproval.payerId,
          previousPreapprovalId: preapproval.previousPreapprovalId,
          user_id: preapproval.userId,
          isCurrent: preapproval.isCurrent,
        },
      })

    if (!preapproval.previousPreapprovalId) {
      await create()
      return
    }

    await this.prisma.$transaction([
      create(),
      this.prisma.preapproval.update({
        where: { id_preapproval: preapproval.previousPreapprovalId },
        data: { isCurrent: false },
      }),
    ])
  }

  async getByPrepprovalId(preapprovalId: string): Promise<Preapproval | null> {
    const preapprovalDb = await this.prisma.preapproval.findUnique({
      where: { id_preapproval: preapprovalId },
    })

    if (!preapprovalDb) return null

    return new Preapproval(mapPreapprovalDBToDomain(preapprovalDb))
  }

  async checkIfExists(preapprovalId: string): Promise<boolean> {
    const preapprovalDb = await this.prisma.preapproval.findUnique({
      where: { id_preapproval: preapprovalId },
      select: { id_preapproval: true },
    })

    return Boolean(preapprovalDb)
  }

  async save(preapproval: Preapproval): Promise<void> {
    await this.prisma.preapproval.update({
      where: { id_preapproval: preapproval.preapprovalId },
      data: {
        planName: preapproval.planName,
        status: preapproval.status,
        isCurrent: preapproval.isCurrent,
      },
    })
  }
}

export function mapPreapprovalDBToDomain(
  preapprovalDb: NonNullable<Awaited<ReturnType<PrismaClient["preapproval"]["findFirst"]>>>
): Preapproval {
  const planName = preapprovalPlanNameSchema.parse(preapprovalDb.planName)
  const status = preapprovalStatusSchema.parse(preapprovalDb.status)
  if (!preapprovalDb.user_id) throw new Error("NSTH: Found preapproval without owner.")

  return new Preapproval({
    isCurrent: Boolean(preapprovalDb.isCurrent),
    createdAt: preapprovalDb.createdAt,
    payerId: preapprovalDb.payerId ?? undefined,
    preapprovalId: preapprovalDb.id_preapproval,
    previousPreapprovalId: preapprovalDb.previousPreapprovalId,
    userId: preapprovalDb.user_id,
    status,
    planName,
  })
}
