import {
  ApplicationError,
  type AppAccountStatusIddle,
  type PlanRepository,
  type SteamAccountClientStateCacheRepository,
} from "core"
import type { SteamAccountClient } from "~/application/services/steam"
import type { FarmGamesUseCase } from "~/application/use-cases/FarmGamesUseCase"
import type { Publisher } from "~/infra/queue"
import { Logger } from "~/utils/Logger"
import { PlanMaxUsageExceededCommand } from "../commands/PlanMaxUsageExceededCommand"

type AccountName = string

export class UserClientsStorage {
  steamAccountClients: Map<AccountName, SteamAccountClient> = new Map()
  readonly logger: Logger

  constructor(
    readonly username: string,
    private readonly sacStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly farmGamesUseCase: FarmGamesUseCase,
    private readonly planRepository: PlanRepository,
    private readonly publisher: Publisher
  ) {
    this.logger = new Logger(`User SAC Storage`)
  }

  addAccountClient(sac: SteamAccountClient) {
    this.logger.log("Appending refreshtoken cache listener on refreshToken event.")
    // mais correto seria deixar esse handler como fixo no evento de refreshToken
    // em vez de depender de ser o ultimo handler
    sac.emitter.once("gotRefreshToken", async ({ accountName, userId, planId, refreshToken, username }) => {
      await this.sacStateCacheRepository.setRefreshToken(accountName, {
        refreshToken,
        userId,
        username,
        planId,
      })
      sac.logger.log("refreshtoken set in cache.")
    })

    sac.emitter.once("hasSession", async () => {
      await this.sacStateCacheRepository.init({
        accountName: sac.accountName,
        planId: sac.planId,
        username: sac.username,
      })
      const sacStateCache = await this.sacStateCacheRepository.get(sac.accountName)
      if (sacStateCache && !sac.logged) {
        sac.emitter.emit("relog-with-state", sac.getCache().toDTO())
      } else {
        sac.emitter.emit("relog")
      }
    })

    sac.emitter.on("relog-with-state", async state => {
      // TROCAR A LOGICA DESSA FUNÇÃO POR UMA USE CASE DE RESTAURAR ESTADO

      const { accountName, username, gamesPlaying, isFarming, planId, farmStartedAt } = state
      // sac.setStatus(status)
      this.logger.log(`${accountName} relogou com state.`)
      if (isFarming) {
        this.logger.log(`${accountName} relogou farmando os jogos ${gamesPlaying}`)
        const plan = await this.planRepository.getById(planId)
        if (!plan) {
          this.logger.log("Plan not found! Contact the developer.", { planId, accountName })
          return
        }
        const [error] = await this.farmGamesUseCase.execute({
          accountName,
          gamesId: gamesPlaying,
          planId,
          sac,
          username,
          session: farmStartedAt
            ? {
                type: "CONTINUE-FROM-PREVIOUS",
                farmStartedAt: new Date(farmStartedAt),
              }
            : {
                type: "NEW",
              },
        })
        if (error?.code === "[FarmUsageService]:PLAN-MAX-USAGE-EXCEEDED") {
          this.publisher.publish(
            new PlanMaxUsageExceededCommand({
              state: sac.getCache().toDTO(),
              when: new Date(),
            })
          )
          console.log(`emitindo evento PLAN-MAX-USAGE-EXCEEDED para conta ${sac.accountName}`)
        }
      }
    })

    sac.emitter.on("relog", () => {
      this.logger.log(`Usuário relogou sem state.`)
    })

    this.steamAccountClients.set(sac.accountName, sac)
  }

  removeAccountClient(accountName: string) {
    const sac = this.steamAccountClients.get(accountName)
    if (!sac) {
      console.log(`NSTH: SAC para [${accountName}], não está no cluster do [${this.username}]`)
      return
    }
    sac.logoff()
    this.steamAccountClients.delete(accountName)
  }

  getAccountClientOrThrow(accountName: string) {
    const steamAccountClient = this.steamAccountClients.get(accountName)
    if (!steamAccountClient)
      throw new ApplicationError("Essa Steam Account nunca foi logada no nosso servidor.")
    return steamAccountClient
  }

  getAccountClient(accountName: string) {
    return this.steamAccountClients.get(accountName) ?? null
  }

  hasAccountName(accountName: string) {
    return this.steamAccountClients.has(accountName)
  }

  getAccountsStatus() {
    const accountStatus = {} as Record<
      string,
      {
        farming: boolean
        logged: boolean
        gamesPlaying: number[]
        gamesStaging: number[]
        status: AppAccountStatusIddle
        farmStartedAt: string | null
      }
    >
    this.steamAccountClients.forEach((client, accountName) => {
      accountStatus[accountName] = {
        farming: client.isFarming(),
        logged: client.logged,
        gamesPlaying: client.getGamesPlaying(),
        gamesStaging: client.getGamesStaging(),
        status: client.getStatus(),
        farmStartedAt: client.getCache().farmStartedAt?.toISOString() ?? null,
      }
    })
    return accountStatus
  }
}
