import { PrismaClient } from "@prisma/client"
import { PreapprovalDAO, PreapprovalQueryId } from "~/infra/dao/PreapprovalDAO"

export class PreapprovalDAODatabase implements PreapprovalDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async getCurrentPreapprovalId(userId: string): Promise<string | null> {
    const query = await this.prisma.preapproval.findFirst({
      where: { user_id: userId, isCurrent: true },
      select: { id_preapproval: true },
    })

    if (!query) return null
    return query.id_preapproval
  }

  async getPreviousPreapprovalId(preapprovalId: string): Promise<string | null> {
    const query = await this.prisma.preapproval.findFirst({
      where: { id_preapproval: preapprovalId },
      select: { previousPreapprovalId: true },
    })

    if (!query) return null
    return query.previousPreapprovalId
  }
}
