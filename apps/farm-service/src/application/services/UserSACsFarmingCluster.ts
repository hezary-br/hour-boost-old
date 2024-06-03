import {
  ApplicationError,
  type DataOrError,
  type DataOrFail,
  Fail,
  PlanInfinity,
  type PlanRepository,
  PlanUsage,
  type SACStateCache,
  type SteamAccountClientStateCacheRepository,
  type SteamAccountsRepository,
} from "core"
import { ErrorOccuredOnSteamClientCommand } from "~/application/commands"
import type { FarmServiceBuilder } from "~/application/factories"
import {
  type EventEmitter,
  type FarmInfinityService,
  type FarmService,
  type FarmUsageService,
  SACList,
} from "~/application/services"
import type { SteamAccountClient } from "~/application/services/steam"
import { EAppResults, type SACGenericError } from "~/application/use-cases"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import type { Publisher } from "~/infra/queue"
import type { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { bad, nice } from "~/utils/helpers"
import { thisErrorShouldScheduleAutoRestarter } from "~/utils/shouldScheduleAutoRestater"

export interface IUserSACsFarmingCluster {
  addSAC(...args: any[]): DataOrError<{ userCluster: UserSACsFarmingCluster }>
  farmWithAccount(details: NSUserCluster.FarmWithAccount): Promise<DataOrFail<Fail>>
  farmService: FarmService
}

export class UserSACsFarmingCluster implements IUserSACsFarmingCluster {
  private readonly publisher: Publisher
  farmService: FarmUsageService | FarmInfinityService
  private readonly sacList: SACList = new SACList()
  private readonly username: string
  private readonly sacStateCacheRepository: SteamAccountClientStateCacheRepository
  private readonly planRepository: PlanRepository
  private readonly farmServiceFactory: FarmServiceBuilder
  private readonly planId: string
  // private readonly logger: Logger
  private shouldPersistSession = true
  readonly emitter: EventEmitter<UserClusterEvents>
  readonly steamAccountsRepository: SteamAccountsRepository

  constructor(props: UserSACsFarmingClusterProps) {
    this.farmService = props.farmService
    this.username = props.username
    this.sacStateCacheRepository = props.sacStateCacheRepository
    this.planRepository = props.planRepository
    this.farmServiceFactory = props.farmServiceFactory
    this.planId = props.planId
    this.emitter = props.emitter
    this.publisher = props.publisher
    this.steamAccountsRepository = props.steamAccountsRepository
    // this.logger = new Logger(`Cluster ~ ${this.username}`)
  }

  addSAC(sac: SteamAccountClient) {
    if (this.sacList.has(sac.accountName))
      return bad(
        new ApplicationError(
          "[SAC Cluster]: Attempt to add sac that already exists.",
          403,
          undefined,
          "TRIED_TO_ADD::ALREADY_EXISTS"
        )
      )
    this.sacList.set(sac.accountName, sac)

    ctxLog(`Appending interrupt async listener on ${sac.accountName}'s sac!`)

    sac.emitter.on("user-logged-off", () => {
      ctxLog(`${sac.accountName} logged off.`)
      this.shouldPersistSession = false
    })

    this.emitter.on("service:max-usage-exceeded", () => {
      this.shouldPersistSession = false
    })

    sac.emitter.on("hasSession", async () => {
      this.shouldPersistSession = true
    })

    sac.emitter.on("interrupt", async (cacheState, error) => {
      if (!sac.autoRestart && thisErrorShouldScheduleAutoRestarter(error.eresult)) {
        this.shouldPersistSession = false
      }
      if (this.shouldPersistSession) {
        await this.sacStateCacheRepository.save(sac.getCache())
        ctxLog(`${sac.accountName} set cache: `, sac.getCache().toDTO())
      }

      this.pauseFarmOnAccount({
        accountName: sac.accountName,
        isFinalizingSession: !this.shouldPersistSession,
      })

      const plan = await this.planRepository.getById(this.planId)
      // esse codigo deve ir para dentro de um handler do `ErrorOccuredOnSteamClientCommand`
      if (plan instanceof PlanInfinity) {
        const steamAccount = await this.steamAccountsRepository.getByAccountName(cacheState.accountName)
        if (!steamAccount || !steamAccount.autoRelogin) return
        this.publisher.publish(
          new ErrorOccuredOnSteamClientCommand({
            when: new Date(),
            accountName: sac.accountName,
            errorEResult: error.eresult,
          })
        )
      }
    })

    sac.emitter.on("access-denied", async ({ accountName }) => {
      await this.sacStateCacheRepository.deleteAllEntriesFromAccount(accountName)
    })

    return nice({
      userCluster: this as UserSACsFarmingCluster,
    })
  }

  getAccountsStatus() {
    return this.farmService.getAccountsStatus()
  }

  stopFarmAllAccounts(props: { isFinalizingSession: boolean }) {
    this.sacList.stopFarmAllAccounts()
    this.farmService.stopFarmAllAccounts(props)
  }

  updateState({ gamesPlaying, accountName }: SACStateCache) {
    // const sac = this.sacList.get(accountName)
  }

  isFarming() {
    const isFarmingSACs = this.sacList.hasAccountsFarming()
    const isFarmingService = this.farmService.hasAccountsFarming()
    if (!isFarmingService && isFarmingSACs)
      throw new ApplicationError("Erro. SAC farmando, porém sem Farm Service!")
    if (isFarmingSACs !== isFarmingService)
      throw new ApplicationError("Mismatch entre isFarmingSACs e isFarmingService")
    return isFarmingSACs
  }

  hasSteamAccountClient(accountName: string) {
    return !!this.sacList.has(accountName)
  }

  async farmWithAccount({ accountName, gamesId, planId, session, plan }: NSUserCluster.FarmWithAccount) {
    const sac = this.sacList.get(accountName)
    if (!sac) return bad(Fail.create(EAppResults["SAC-NOT-FOUND"], 404))

    if (!this.farmService.hasAccountsFarming()) {
      ctxLog("SETANDO PRIMEIRO FARM")
      plan ??= await this.planRepository.getById(planId)
      if (!plan) {
        return bad(Fail.create(EAppResults["PLAN-NOT-FOUND"], 404, { planId }))
      }
      this.updateFarmService(plan, session)
    }
    const [errorFarming, result] = await this.farmWithAccountImpl(sac, accountName, gamesId)
    if (!errorFarming && session.type === "CONTINUE-FROM-PREVIOUS") {
      sac.setFarmStartedAt(session.farmStartedAt)
    }
    await this.sacStateCacheRepository.save(sac.getCache())
    if (errorFarming) return bad(errorFarming)
    return nice(result)
  }

  private async farmWithAccountImpl(sac: SteamAccountClient, accountName: string, gamesId: number[]) {
    ctxLog(`Appending account to farm on service: `, accountName)
    if (!this.isAccountFarmingOnService(accountName)) {
      const [cantFarm] = this.farmService.checkIfCanFarm()
      if (cantFarm) {
        const [,] = sac.stopFarm()
        return bad(cantFarm)
      }
    }

    const [error] = sac.farmGames(gamesId)
    if (error) return bad(error)
    // const errorTryingToFarm = false
    const errorTryingToFarm = await Promise.race([
      new Promise<SACGenericError>(res => sac.client.once("error", res)),
      new Promise<false>(res =>
        setTimeout(() => res(false), process.env.NODE_ENV === "TEST" ? 0 : 400).unref()
      ),
    ])

    if (errorTryingToFarm) {
      const fail = new Fail({
        code: `cluster.farmWithAccount()::${EAppResults["UNKNOWN-CLIENT-ERROR"]}`,
        httpStatus: 400,
        payload: errorTryingToFarm,
      })
      return bad(fail)
    }

    if (!this.isAccountFarmingOnService(accountName)) {
      const [error] = this.farmService.farmWithAccount(accountName, sac)
      if (error) return bad(error)
    }
    return nice(null)
  }

  private updateFarmService(
    plan: PlanInfinity | PlanUsage,
    session: NSUserCluster.FarmWithAccount["session"]
  ) {
    const farmStartedAt = session.type === "CONTINUE-FROM-PREVIOUS" ? session.farmStartedAt : new Date()
    // const newFarmService = this.farmServiceFactory.create(this.username, plan, farmStartedAt)
    const newFarmService = this.farmServiceFactory.create(this.username, plan, new Date())
    this.setFarmService(newFarmService)
  }

  private pauseFarmOnAccountImpl({
    accountName,
    isFinalizingSession = true,
  }: NSUserCluster.PauseFarmOnAccountProps) {
    if (this.sacList.list.size === 0) {
      return bad(Fail.create("DO-NOT-HAVE-ACCOUNTS-FARMING", 403))
    }
    // return [new ApplicationError("Usuário não possui contas farmando.", 402)]
    const sac = this.sacList.get(accountName)
    if (!sac) {
      return bad(Fail.create("TRIED-TO-STOP-FARM-ON-NON-FARMING-ACCOUNT", 403))
    }
    // this.farmService.pauseFarmOnAccount(accountName)
    sac.stopFarm()
    if (isFinalizingSession) {
      console.log("44: isFinalizingSession true, salvando esse cache", sac.getCache().toDTO(), {
        startedAt: sac.getCache().toDTO().farmStartedAt,
      })
      const savingCachePromise = this.sacStateCacheRepository.save(sac.getCache())
      return nice({ savingCachePromise })
    }
    sac.stopFarm_CLIENT_()
    return nice({ savingCachePromise: undefined })
  }

  pauseFarmOnAccount(props: NSUserCluster.PauseFarmOnAccountProps) {
    const [errorPausingFarm] = this.pauseFarmOnAccountImpl(props)
    if (errorPausingFarm) return bad(errorPausingFarm)
    const errorOrUsages = this.farmService.pauseFarmOnAccount(
      props.accountName,
      props.isFinalizingSession ?? false
    )
    return errorOrUsages
  }

  pauseFarmOnAccountSync(props: NSUserCluster.PauseFarmOnAccountProps) {
    const [errorPausingFarm, promises] = this.pauseFarmOnAccountImpl(props)
    if (errorPausingFarm) return bad(errorPausingFarm)
    const [error, usages] = this.farmService.pauseFarmOnAccountSync(
      props.accountName,
      props.isFinalizingSession
    )
    if (error) return bad(error)
    return nice({ usages, promises })
  }

  setFarmService(newFarmService: FarmUsageService | FarmInfinityService) {
    this.farmService = newFarmService
  }

  isAccountFarmingOnService(accountName: string): boolean {
    return this.farmService.isAccountFarming(accountName)
  }

  removeSAC(accountName: string) {
    this.sacList.delete(accountName)
  }
}

export type UserSACsFarmingClusterProps = {
  farmService: FarmUsageService | FarmInfinityService
  username: string
  sacStateCacheRepository: SteamAccountClientStateCacheRepository
  planRepository: PlanRepository
  farmServiceFactory: FarmServiceBuilder
  planId: string
  publisher: Publisher
  emitter: EventEmitter<UserClusterEvents>
  usageBuilder: UsageBuilder
  steamAccountsRepository: SteamAccountsRepository
}

export type UserClusterEvents = {
  "service:max-usage-exceeded": []
}

export namespace NSUserCluster {
  export type PauseFarmOnAccountProps = {
    accountName: string
    /**
     * Se true, significa que a sessão vai ser limpa no cache e no front vai constar que ele parou o farm.
     *
     * Se false, pressupõe que essa sessão será retomada em breve por quem está chamando ou um cron.
     *
     * Idealmente deve finalizar a sessão, drivers que façam sentido para o usuário, como ele mesmo quando chama stop farm, ou a Steam por meio de um disconnect.
     */
    isFinalizingSession: boolean
  }

  export type SessionTypeName = SessionType["type"]

  export type FarmWithAccount = {
    accountName: string
    gamesId: number[]
    planId: string
    session: SessionType
    plan?: PlanUsage | PlanInfinity | null
  }

  export type SessionType = SessionContinueFromPrevious | SessionNew

  type SessionContinueFromPrevious = {
    type: "CONTINUE-FROM-PREVIOUS"
    farmStartedAt: Date
  }

  type SessionNew = {
    type: "NEW"
  }
}
