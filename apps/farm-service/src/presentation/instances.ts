import clerkClient from "@clerk/clerk-sdk-node"
import { AddSteamAccount, IDGeneratorUUID } from "core"
import SteamUser from "steam-user"
import { AutoRestartCron } from "~/application/cron/AutoRestartCron"
import { FarmServiceBuilder } from "~/application/factories"
import { AllUsersClientsStorage, UsersSACsFarmingClusterStorage } from "~/application/services"
import { HashService } from "~/application/services/HashService"
import { TokenService } from "~/application/services/TokenService"
import {
  AddSteamAccountUseCase,
  CheckSteamAccountOwnerStatusUseCase,
  FarmGamesUseCase,
  GetPersonaStateUseCase,
  GetUserSteamGamesUseCase,
  RefreshPersonaStateUseCase,
  RemoveSteamAccountUseCase,
  RestoreAccountConnectionUseCase,
  RestoreAccountSessionUseCase,
  ScheduleAutoRestartUseCase,
} from "~/application/use-cases"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { RetrieveSessionListUseCase } from "~/application/use-cases/RetrieveSessionListUseCase"
import { SetMaxSteamAccountsUseCase } from "~/application/use-cases/SetMaxSteamAccountsUseCase"
import { StopFarmUseCase } from "~/application/use-cases/StopFarmUseCase"
import type { SteamBuilder } from "~/contracts/SteamBuilder"
import { AutoRestarterScheduler } from "~/domain/cron"
import {
  LogSteamStartFarmHandler,
  LogSteamStopFarmHandler,
  PersistFarmSessionHandler,
  ScheduleAutoRestartHandler,
  StartFarmPlanHandler,
} from "~/domain/handler"
import { UpdateAccountCacheStateHandler } from "~/domain/handler/UpdateAccountCacheStateHandler"
import { UpdateRefreshTokenPlanIdHandler } from "~/domain/handler/UpdateRefreshTokenPlanIdHandler"
import { StagingGamesListService } from "~/domain/services"
import { PlanService } from "~/domain/services/PlanService"
import { UserService } from "~/domain/services/UserService"
import { TrimSteamAccounts } from "~/domain/utils/trim-steam-accounts"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { FlushUpdateSteamAccountUseCase } from "~/features/flush-update-steam-account/use-case"
import { RemoveSteamAccount } from "~/features/remove-steam-account/domain"
import { StopFarmDomain } from "~/features/stop-farm/domain"
import { UsersDAODatabase } from "~/infra/dao"
import { SteamAccountsDAODatabase } from "~/infra/dao/SteamAccountsDAODatabase"
import { prisma } from "~/infra/libs"
import { redis } from "~/infra/libs/redis"
import { Publisher } from "~/infra/queue"
import {
  PlanRepositoryDatabase,
  SteamAccountClientStateCacheRedis,
  SteamAccountsRepositoryDatabase,
  UsersRepositoryDatabase,
} from "~/infra/repository"
import { ClerkAuthentication } from "~/infra/services"
import { RefreshGamesUseCase } from "~/presentation/presenters"
import { EventEmitterBuilder, SteamAccountClientBuilder, UserClusterBuilder } from "~/utils/builders"
import { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { makeResetFarm, makeResetFarmEntities } from "~/utils/resetFarm"

const httpProxy = process.env.PROXY_URL

if (httpProxy) {
  console.log(`Usando proxy ${httpProxy.slice(0, 18)}*******`)
}

const options: ConstructorParameters<typeof SteamUser>[0] = {
  enablePicsCache: true,
  autoRelogin: false,
  protocol: SteamUser.EConnectionProtocol.WebSocket,
}
if (httpProxy) options.httpProxy = httpProxy

export const steamBuilder: SteamBuilder = {
  // create: () => makeUserSteamMock(),
  create: () => new SteamUser(options),
}

export const hashService = new HashService()
export const steamUserBuilder = steamBuilder
const usageBuilder = new UsageBuilder()
export const publisher = new Publisher()
export const emitterBuilder = new EventEmitterBuilder()
export const autoRestarterScheduler = new AutoRestarterScheduler()
export const planRepository = new PlanRepositoryDatabase(prisma)
export const steamAccountsRepository = new SteamAccountsRepositoryDatabase(prisma)
export const steamAccountClientStateCacheRepository = new SteamAccountClientStateCacheRedis(redis)
export const userAuthentication = new ClerkAuthentication(clerkClient)
export const usersRepository = new UsersRepositoryDatabase(prisma)
export const idGenerator = new IDGeneratorUUID()

export const sacBuilder = new SteamAccountClientBuilder(emitterBuilder, publisher, steamUserBuilder)

export const farmServiceBuilder = new FarmServiceBuilder({
  publisher,
  emitterBuilder,
})
export const userClusterBuilder = new UserClusterBuilder(
  farmServiceBuilder,
  steamAccountClientStateCacheRepository,
  planRepository,
  emitterBuilder,
  publisher,
  usageBuilder,
  steamAccountsRepository
)
export const usersClusterStorage = new UsersSACsFarmingClusterStorage(userClusterBuilder)
export const farmGamesUseCase = new FarmGamesUseCase(usersClusterStorage)
export const allUsersClientsStorage = new AllUsersClientsStorage(
  sacBuilder,
  steamAccountClientStateCacheRepository,
  farmGamesUseCase,
  planRepository,
  publisher
)
export const tokenService = new TokenService()

// export const farmingUsersStorage = new FarmingUsersStorage()

export const checkSteamAccountOwnerStatusUseCase = new CheckSteamAccountOwnerStatusUseCase(
  steamAccountsRepository
)

export const refreshPersonaState = new RefreshPersonaStateUseCase(
  steamAccountClientStateCacheRepository,
  allUsersClientsStorage
)

export const getPersonaStateUseCase = new GetPersonaStateUseCase(
  steamAccountClientStateCacheRepository,
  refreshPersonaState
)

export const refreshGamesUseCase = new RefreshGamesUseCase(
  steamAccountClientStateCacheRepository,
  allUsersClientsStorage
)
export const getUserSteamGamesUseCase = new GetUserSteamGamesUseCase(
  steamAccountClientStateCacheRepository,
  refreshGamesUseCase
)

export const usersDAO = new UsersDAODatabase(
  prisma,
  getPersonaStateUseCase,
  getUserSteamGamesUseCase,
  steamAccountClientStateCacheRepository,
  usersClusterStorage,
  allUsersClientsStorage,
  planRepository
)
export const removeSteamAccount = new RemoveSteamAccount(
  allUsersClientsStorage,
  usersClusterStorage,
  autoRestarterScheduler
)

export const removeSteamAccountUseCase = new RemoveSteamAccountUseCase(
  usersRepository,
  steamAccountClientStateCacheRepository,
  planRepository,
  removeSteamAccount
)
export const userService = new UserService()
export const planService = new PlanService()
export const restoreAccountSessionUseCase = new RestoreAccountSessionUseCase(usersClusterStorage, publisher)
export const trimSteamAccounts = new TrimSteamAccounts(removeSteamAccount)
export const changeUserPlanUseCase = new ChangeUserPlanUseCase(
  allUsersClientsStorage,
  usersRepository,
  planService,
  steamAccountClientStateCacheRepository,
  restoreAccountSessionUseCase,
  userService,
  trimSteamAccounts,
  planRepository,
  publisher
)
export const steamAccountsDAO = new SteamAccountsDAODatabase(prisma)

export const restoreAccountConnectionUseCase = new RestoreAccountConnectionUseCase(
  allUsersClientsStorage,
  usersClusterStorage,
  steamAccountClientStateCacheRepository,
  hashService
)

export const autoRestartCron = new AutoRestartCron(
  allUsersClientsStorage,
  planRepository,
  steamAccountsRepository,
  restoreAccountConnectionUseCase,
  restoreAccountSessionUseCase,
  usersDAO,
  steamAccountClientStateCacheRepository
)

export const resetFarm = makeResetFarm({
  allUsersClientsStorage,
  steamAccountClientStateCacheRepository,
  usersSACsFarmingClusterStorage: usersClusterStorage,
})

const resetFarmEntities = makeResetFarmEntities({
  allUsersClientsStorage,
  usersSACsFarmingClusterStorage: usersClusterStorage,
})
export const flushUpdateSteamAccountDomain = new FlushUpdateSteamAccountDomain(
  allUsersClientsStorage,
  resetFarmEntities
)
export const flushUpdateSteamAccountUseCase = new FlushUpdateSteamAccountUseCase(
  steamAccountClientStateCacheRepository,
  planRepository,
  flushUpdateSteamAccountDomain
)

export const scheduleAutoRestartUseCase = new ScheduleAutoRestartUseCase(
  autoRestarterScheduler,
  autoRestartCron
)

export const retrieveSessionAccountsUseCase = new RetrieveSessionListUseCase(
  steamAccountClientStateCacheRepository
)
export const stopFarmDomain = new StopFarmDomain(usersClusterStorage)
export const stopFarmUseCase = new StopFarmUseCase(planRepository, stopFarmDomain)

export const stagingGamesListService = new StagingGamesListService()

const addSteamAccount = new AddSteamAccount(usersRepository, idGenerator)

export const addSteamAccountUseCase = new AddSteamAccountUseCase(
  addSteamAccount,
  allUsersClientsStorage,
  usersDAO,
  checkSteamAccountOwnerStatusUseCase,
  hashService
)

publisher.register(new StartFarmPlanHandler())
publisher.register(
  new PersistFarmSessionHandler(
    planRepository,
    steamAccountClientStateCacheRepository,
    allUsersClientsStorage
  )
)

// publisher.register(new LogUserFarmedHandler())

publisher.register(new LogSteamStopFarmHandler())
publisher.register(new LogSteamStartFarmHandler())
publisher.register(new UpdateAccountCacheStateHandler(steamAccountClientStateCacheRepository))
publisher.register(new ScheduleAutoRestartHandler(scheduleAutoRestartUseCase))
publisher.register(new UpdateRefreshTokenPlanIdHandler(steamAccountClientStateCacheRepository))
// publisher.register(new LogUserCompleteFarmSessionHandler())

/**
 * Locals
 */
export const setMaxSteamAccountsUseCase = new SetMaxSteamAccountsUseCase(
  usersRepository,
  flushUpdateSteamAccountDomain,
  trimSteamAccounts,
  steamAccountClientStateCacheRepository,
  planRepository
)
