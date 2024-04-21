import type { PrismaClient } from "@prisma/client"
import { SteamAccount, SteamAccountCredentials, type SteamAccountsRepository } from "core"

export class SteamAccountsRepositoryDatabase implements SteamAccountsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(steamAccount: SteamAccount): Promise<void> {
    await this.prisma.steamAccount.update({
      where: { id_steamAccount: steamAccount.id_steamAccount },
      data: {
        autoRelogin: steamAccount.autoRelogin,
        owner_id: steamAccount.ownerId,
      },
    })
  }

  async getByAccountName(accountName: string): Promise<SteamAccount | null> {
    const dbSteamAccount = await this.prisma.steamAccount.findUnique({
      where: { accountName },
    })

    if (!dbSteamAccount) return null

    return SteamAccount.restore({
      credentials: SteamAccountCredentials.restore({
        accountName: dbSteamAccount.accountName,
        password: dbSteamAccount.password,
      }),
      id_steamAccount: dbSteamAccount.id_steamAccount,
      ownerId: dbSteamAccount.owner_id,
      autoRelogin: dbSteamAccount.autoRelogin,
      isRequiringSteamGuard: dbSteamAccount.isRequiringSteamGuard,
    })
  }
}
