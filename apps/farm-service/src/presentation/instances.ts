import { IDGeneratorUUID } from "core"
import SteamUser from "steam-user"
import { FarmServiceBuilder } from "~/application/factories"
import { AllUsersClientsStorage, UsersSACsFarmingClusterStorage } from "~/application/services"
import {
  CheckSteamAccountOwnerStatusUseCase,
  GetPersonaStateUseCase,
  GetUserSteamGamesUseCase,
  RefreshPersonaStateUseCase,
  RestoreAccountSessionUseCase,
  FarmGamesUseCase,
  ScheduleAutoRestartUseCase,
  RestoreAccountConnectionUseCase,
  RemoveSteamAccountUseCase,
} from "~/application/use-cases"
import { SteamBuilder } from "~/contracts/SteamBuilder"
import { AutoRestarterScheduler } from "~/domain/cron"
import {
  LogSteamStartFarmHandler,
  LogSteamStopFarmHandler,
  StartFarmPlanHandler,
  PersistFarmSessionHandler,
  ScheduleAutoRestartHandler,
} from "~/domain/handler"
import { UsersDAODatabase } from "~/infra/dao"
import { prisma } from "~/infra/libs"
import { redis } from "~/infra/libs/redis"
import { Publisher } from "~/infra/queue"
import {
  PlanRepositoryDatabase,
  SteamAccountsRepositoryDatabase,
  UsersRepositoryDatabase,
  SteamAccountClientStateCacheRedis,
} from "~/infra/repository"
import { ClerkAuthentication } from "~/infra/services"
import { RefreshGamesUseCase } from "~/presentation/presenters"
import { EventEmitterBuilder, SteamAccountClientBuilder } from "~/utils/builders"
import { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { UserClusterBuilder } from "~/utils/builders"
import { AutoRestartCron } from "~/application/cron/AutoRestartCron"
import { SteamAccountsDAODatabase } from "~/infra/dao/SteamAccountsDAODatabase"
import { RetrieveSessionListUseCase } from "~/application/use-cases/RetrieveSessionListUseCase"
import { StagingGamesListService } from "~/domain/services"
import { SACStateCacheBuilder } from "~/utils/builders/SACStateCacheBuilder"
import { TokenService } from "~/application/services/TokenService"
import { UpdateAccountCacheStateHandler } from "~/domain/handler/UpdateAccountCacheStateHandler"
import { ChangeUserPlanToCustomUseCase } from "~/application/use-cases/ChangeUserPlanToCustomUseCase"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { PlanService } from "~/domain/services/PlanService"
import { UserService } from "~/domain/services/UserService"
import clerkClient from "@clerk/clerk-sdk-node"

const httpProxy = process.env.PROXY_URL

if (httpProxy) {
  console.log(`Usando proxy ${httpProxy.slice(0, 18) + "*******"}`)
}

let options: ConstructorParameters<typeof SteamUser>[0] = {
  enablePicsCache: true,
  autoRelogin: false,
}
if (httpProxy) options.httpProxy = httpProxy

console.log({ options })
export const steamBuilder: SteamBuilder = {
  create: () => new SteamUser(options),
}

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
export const sacStateCacheBuilder = new SACStateCacheBuilder()

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
  allUsersClientsStorage
)
export const removeSteamAccountUseCase = new RemoveSteamAccountUseCase(
  usersRepository,
  allUsersClientsStorage,
  steamAccountClientStateCacheRepository,
  usersClusterStorage,
  planRepository,
  autoRestarterScheduler
)
export const userService = new UserService()
export const planService = new PlanService()
export const restoreAccountSessionUseCase = new RestoreAccountSessionUseCase(usersClusterStorage, publisher)
export const changeUserPlanUseCase = new ChangeUserPlanUseCase(
  allUsersClientsStorage,
  usersRepository,
  planService,
  steamAccountClientStateCacheRepository,
  removeSteamAccountUseCase,
  restoreAccountSessionUseCase,
  userService
)
export const changeUserPlanToCustomUseCase = new ChangeUserPlanToCustomUseCase(changeUserPlanUseCase)
export const steamAccountsDAO = new SteamAccountsDAODatabase(prisma)

export const restoreAccountConnectionUseCase = new RestoreAccountConnectionUseCase(
  allUsersClientsStorage,
  usersClusterStorage,
  steamAccountClientStateCacheRepository
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

export const scheduleAutoRestartUseCase = new ScheduleAutoRestartUseCase(
  autoRestarterScheduler,
  autoRestartCron
)

export const retrieveSessionAccountsUseCase = new RetrieveSessionListUseCase(
  steamAccountClientStateCacheRepository
)

export const stagingGamesListService = new StagingGamesListService()

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
// publisher.register(new LogUserCompleteFarmSessionHandler())
