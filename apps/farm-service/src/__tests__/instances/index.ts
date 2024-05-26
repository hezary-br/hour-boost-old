import {
  AddSteamAccount,
  ApplicationError,
  IDGeneratorUUID,
  type PlanInfinity,
  PlanUsage,
  SteamAccount,
  SteamAccountCredentials,
  type SteamAccountsRepository,
  type Usage,
  type User,
} from "core"
import type Redis from "ioredis"
import { makeSACFactory } from "~/__tests__/factories"
import { FarmServiceBuilder } from "~/application/factories"
import { AllUsersClientsStorage, UsersSACsFarmingClusterStorage } from "~/application/services"
import { HashService } from "~/application/services/HashService"
import type { SteamAccountClient } from "~/application/services/steam"
import {
  AddSteamAccountUseCase,
  CheckSteamAccountOwnerStatusUseCase,
  RemoveSteamAccountUseCase,
  RestoreAccountSessionUseCase,
} from "~/application/use-cases"
import { AddUsageTimeToPlanUseCase } from "~/application/use-cases/AddUsageTimeToPlanUseCase"
import { ChangeUserPlanUseCase } from "~/application/use-cases/ChangeUserPlanUseCase"
import { CreateUserUseCase } from "~/application/use-cases/CreateUserUseCase"
import { FarmGamesUseCase } from "~/application/use-cases/FarmGamesUseCase"
import { SetMaxSteamAccountsUseCase } from "~/application/use-cases/SetMaxSteamAccountsUseCase"
import { StopFarmUseCase } from "~/application/use-cases/StopFarmUseCase"
import { makeFarmGames } from "~/application/use-cases/__tests_helpers"
import { InitUserGatewayMemory } from "~/contracts/InitUserGatewayMemory"
import { AutoRestarterScheduler } from "~/domain/cron"
import { PlanService } from "~/domain/services/PlanService"
import { UserService } from "~/domain/services/UserService"
import { TrimSteamAccounts } from "~/domain/utils/trim-steam-accounts"
import { FlushUpdateSteamAccountDomain } from "~/features/flush-update-steam-account/domain"
import { FlushUpdateSteamAccountUseCase } from "~/features/flush-update-steam-account/use-case"
import { RemoveSteamAccount } from "~/features/remove-steam-account/domain"
import { StopFarmDomain } from "~/features/stop-farm/domain"
import { UsersDAOInMemory } from "~/infra/dao"
import { SteamAccountsDAOMemory } from "~/infra/dao/SteamAccountsDAOMemory"
import { Publisher } from "~/infra/queue"
import {
  PlanRepositoryInMemory,
  SteamAccountClientStateCacheInMemory,
  SteamAccountsRepositoryInMemory,
  UsersInMemory,
  UsersRepositoryInMemory,
} from "~/infra/repository"
import { SACCacheInMemory } from "~/infra/repository/SACCacheInMemory"
import { SteamAccountsInMemory } from "~/infra/repository/SteamAccountsInMemory"
import {
  type TestUserProperties,
  type TestUsers,
  UserAuthenticationInMemory,
  testUsers,
} from "~/infra/services/UserAuthenticationInMemory"
import { FarmGamesController } from "~/presentation/controllers"
import { EventEmitterBuilder, SteamAccountClientBuilder } from "~/utils/builders"
import { SteamUserMockBuilder } from "~/utils/builders/SteamMockBuilder"
import { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { UserClusterBuilder } from "~/utils/builders/UserClusterBuilder"
import { makeResetFarm, makeResetFarmEntities } from "~/utils/resetFarm"

export const password = "pass"
export const validSteamAccounts: SteamAccountCredentials[] = [
  { accountName: "paco", password },
  { accountName: "fred", password },
  { accountName: "bane", password },
  { accountName: "plan", password },
]

const idGenerator = new IDGeneratorUUID()

export type MakeTestInstancesProps = {
  validSteamAccounts?: SteamAccountCredentials[]
  createUsers?: string[]
}

export type CustomInstances = Partial<{
  steamUserBuilder: SteamUserMockBuilder
  steamAccountsRepository: SteamAccountsRepository
}>

type CreateUserOptions = Partial<{
  persistSteamAccounts: boolean
}>

export function makeTestInstances(props?: MakeTestInstancesProps, ci?: CustomInstances) {
  const { validSteamAccounts = [] } = props ?? {}
  const redis: Redis = {} as Redis
  // redis = new Redis()

  const autoRestarterScheduler = new AutoRestarterScheduler()
  const idGenerator = new IDGeneratorUUID()
  const publisher = new Publisher()
  const steamAccountsMemory = new SteamAccountsInMemory()
  const usersMemory = new UsersInMemory()
  const sacCacheInMemory = new SACCacheInMemory()
  const steamAccountClientStateCacheRepository = new SteamAccountClientStateCacheInMemory(sacCacheInMemory)
  const usageBuilder = new UsageBuilder()
  // const sacStateCacheRepository = new SteamAccountClientStateCacheRedis(redis)
  const emitterBuilder = new EventEmitterBuilder()
  const userService = new UserService()
  const planService = new PlanService()
  const farmServiceBuilder = new FarmServiceBuilder({
    publisher,
    emitterBuilder,
  })
  const planRepository = new PlanRepositoryInMemory(usersMemory)
  const steamAccountsRepository =
    ci?.steamAccountsRepository ?? new SteamAccountsRepositoryInMemory(usersMemory, steamAccountsMemory)
  const userClusterBuilder = new UserClusterBuilder(
    farmServiceBuilder,
    steamAccountClientStateCacheRepository,
    planRepository,
    emitterBuilder,
    publisher,
    usageBuilder,
    steamAccountsRepository
  )
  const usersClusterStorage = new UsersSACsFarmingClusterStorage(userClusterBuilder)
  const usersRepository = new UsersRepositoryInMemory(usersMemory, steamAccountsMemory)

  const usersDAO = new UsersDAOInMemory(usersMemory)
  const steamAccountsDAO = new SteamAccountsDAOMemory(steamAccountsMemory)
  const steamUserBuilder = ci?.steamUserBuilder ?? new SteamUserMockBuilder(validSteamAccounts)
  const sacBuilder = new SteamAccountClientBuilder(emitterBuilder, publisher, steamUserBuilder)
  const stopFarmDomain = new StopFarmDomain(usersClusterStorage)
  const stopFarmUseCase = new StopFarmUseCase(planRepository, stopFarmDomain)
  const farmGamesUseCase = new FarmGamesUseCase(usersClusterStorage)
  const checkSteamAccountOwnerStatusUseCase = new CheckSteamAccountOwnerStatusUseCase(steamAccountsRepository)
  const hashService = new HashService()
  const allUsersClientsStorage = new AllUsersClientsStorage(
    sacBuilder,
    steamAccountClientStateCacheRepository,
    farmGamesUseCase,
    planRepository,
    publisher
  )
  const userAuthentication = new UserAuthenticationInMemory()
  const initUserGateway = new InitUserGatewayMemory()
  const sacFactory = makeSACFactory(validSteamAccounts, publisher)
  const createUserUseCase = new CreateUserUseCase(
    usersRepository,
    userAuthentication,
    usersClusterStorage,
    initUserGateway
  )
  const removeSteamAccount = new RemoveSteamAccount(
    allUsersClientsStorage,
    usersClusterStorage,
    autoRestarterScheduler
  )

  const removeSteamAccountUseCase = new RemoveSteamAccountUseCase(
    usersRepository,
    steamAccountClientStateCacheRepository,
    planRepository,
    removeSteamAccount
  )
  const trimSteamAccounts = new TrimSteamAccounts(removeSteamAccount)
  const addSteamAccount = new AddSteamAccount(usersRepository, idGenerator)
  const addSteamAccountUseCase = new AddSteamAccountUseCase(
    addSteamAccount,
    allUsersClientsStorage,
    usersDAO,
    checkSteamAccountOwnerStatusUseCase,
    hashService
  )

  const userInstancesBuilder = new UserInstancesBuilder(allUsersClientsStorage)

  const farmGamesController = new FarmGamesController({
    allUsersClientsStorage,
    usersRepository,
    farmGamesUseCase,
    hashService,
  })

  const resetFarm = makeResetFarm({
    allUsersClientsStorage,
    steamAccountClientStateCacheRepository: steamAccountClientStateCacheRepository,
    usersSACsFarmingClusterStorage: usersClusterStorage,
  })

  const farmGames = makeFarmGames(farmGamesController)
  const resetFarmEntities = makeResetFarmEntities({
    allUsersClientsStorage,
    usersSACsFarmingClusterStorage: usersClusterStorage,
  })

  const flushUpdateSteamAccountDomain = new FlushUpdateSteamAccountDomain(
    allUsersClientsStorage,
    resetFarmEntities
  )
  const flushUpdateSteamAccountUseCase = new FlushUpdateSteamAccountUseCase(
    steamAccountClientStateCacheRepository,
    planRepository,
    flushUpdateSteamAccountDomain
  )

  const setMaxSteamAccountsUseCase = new SetMaxSteamAccountsUseCase(
    usersRepository,
    flushUpdateSteamAccountDomain,
    trimSteamAccounts,
    steamAccountClientStateCacheRepository,
    planRepository
  )

  const addUsageTimeToPlanUseCase = new AddUsageTimeToPlanUseCase(
    usersRepository,
    flushUpdateSteamAccountDomain,
    steamAccountClientStateCacheRepository,
    planRepository
  )

  const restoreAccountSessionUseCase = new RestoreAccountSessionUseCase(usersClusterStorage, publisher)

  const changeUserPlanUseCase = new ChangeUserPlanUseCase(
    allUsersClientsStorage,
    usersRepository,
    planService,
    steamAccountClientStateCacheRepository,
    restoreAccountSessionUseCase,
    userService,
    trimSteamAccounts,
    planRepository,
    publisher,
    flushUpdateSteamAccountDomain
  )

  /**
   * Creates a:
   *
   * User user instance
   *
   * User Cluster Storage
   *
   * Creates the steam account associated to this user.
   *
   * VIA PARAMS: Saves this steam account on the database.
   *
   * Returns User, one steam account, and their SACs.
   */
  async function createUser<P extends TestUsers>(userPrefix: P, options?: CreateUserOptions) {
    const { persistSteamAccounts = true } = options ?? {}
    console.log("test instances index > creating user and storing on repo")
    const userHollowData = testUsers[userPrefix]
    const user = await createUserUseCase.execute(userHollowData.userId)
    const userInstances = userInstancesBuilder.create(
      userPrefix,
      testUsers[userPrefix],
      user
    ) as PrefixKeys<P>
    const savingSteamAccount = userInstances[`${userPrefix}SteamAccount`]
    if (!savingSteamAccount) {
      console.log({
        prefix: `${userPrefix}SteamAccount`,
        userInstances,
      })
      throw new Error("NSTH: Não encontrou steam account no user instances para persistir")
    }
    if (persistSteamAccounts) {
      await steamAccountsRepository.save(savingSteamAccount as unknown as SteamAccount)
    }
    return userInstances
  }
  async function addSteamAccountInternally(
    userId: string,
    accountName: string,
    password: string,
    id_steamAccount?: string
  ) {
    const user = await usersRepository.getByID(userId)
    if (!user) throw new Error("addSteamAccount(): INSTANCES TEST Usuário não existe.")
    const [, encryptedPassword] = hashService.encrypt(password)
    const steamAccount = SteamAccount.restore({
      credentials: SteamAccountCredentials.restore({
        accountName,
        password: encryptedPassword,
      }),
      id_steamAccount: id_steamAccount ?? idGenerator.makeID(),
      ownerId: userId,
      autoRelogin: true,
      isRequiringSteamGuard: false,
    })
    user.addSteamAccount(steamAccount)
    await usersRepository.update(user)
    return steamAccount
  }
  async function changeUserPlan(plan: PlanUsage | PlanInfinity) {
    const userId = plan.ownerId
    const user = await usersRepository.getByID(userId)
    if (!user) throw new Error("addSteamAccount(): INSTANCES TEST Usuário não existe.")
    user.assignPlan(plan)
    await usersRepository.update(user)
  }

  async function usePlan(ownerId: string, usage: Usage) {
    const user = await usersRepository.getByID(ownerId)
    if (!user) throw new Error("addSteamAccount(): INSTANCES TEST Usuário não existe.")
    if (!(user.plan instanceof PlanUsage))
      throw new ApplicationError("instances.usePlan() Plano não é do tipo usage.")
    user.plan.use(usage)
    await usersRepository.update(user)
  }

  async function resetSteamAccountsOfUser(userId: string) {
    const user = await usersRepository.getByID(userId)
    if (!user) throw new Error("addSteamAccount(): INSTANCES TEST Usuário não existe.")
    user.steamAccounts.removeAll()
    await usersRepository.update(user)
  }

  return {
    autoRestarterScheduler,
    usersMemory,
    steamAccountsMemory,
    sacCacheInMemory,
    publisher,
    usersClusterStorage,
    allUsersClientsStorage,
    steamUserBuilder,
    userClusterBuilder,
    emitterBuilder,
    usageBuilder,
    sacBuilder,
    usersDAO,
    steamAccountsDAO,
    usersRepository,
    sacStateCacheRepository: steamAccountClientStateCacheRepository,
    steamAccountsRepository,
    planRepository,
    stopFarmUseCase,
    farmGames,
    farmGamesUseCase,
    farmGamesController,
    addSteamAccountUseCase,
    removeSteamAccount,
    removeSteamAccountUseCase,
    setMaxSteamAccountsUseCase,
    checkSteamAccountOwnerStatusUseCase,
    restoreAccountSessionUseCase,
    addUsageTimeToPlanUseCase,
    initUserGateway,
    changeUserPlanUseCase,
    redis,
    planService,
    userService,
    hashService,
    idGenerator,
    userAuthentication,
    resetFarm,
    flushUpdateSteamAccountDomain,
    flushUpdateSteamAccountUseCase,
    async makeUserInstances<P extends TestUsers>(prefix: P, props: TestUserProperties) {
      const user = await createUserUseCase.execute(props.userId)
      return userInstancesBuilder.create(prefix, props, user)
    },
    sacFactory,
    createUser,
    addSteamAccountInternally,
    changeUserPlan,
    usePlan,
    resetSteamAccountsOfUser,
  }
}

export type PrefixKeys<P extends string> = {
  [K in keyof UserRelatedInstances as `${P & string}${K & string}`]: UserRelatedInstances[K]
}

export type UserRelatedInstances = {
  "": User
  SteamAccount: SteamAccount
  SAC: SteamAccountClient
  SAC2: SteamAccountClient
  SAC3: SteamAccountClient
}

interface IUserInstancesBuilder {
  create<P extends TestUsers>(prefix: P, testUsersProps: TestUserProperties, user: User): PrefixKeys<P>
}

class UserInstancesBuilder implements IUserInstancesBuilder {
  constructor(private readonly allUsersClientsStorage: AllUsersClientsStorage) {}

  create<P extends TestUsers>(
    prefix: P,
    { accountName, userId, username, accountName2, accountName3 }: TestUserProperties,
    user: User
  ): PrefixKeys<P> {
    const steamAccount = makeSteamAccount(user.id_user, accountName)
    const sac = this.allUsersClientsStorage.addSteamAccountFrom0({
      accountName,
      userId,
      username,
      planId: user.plan.id_plan,
      autoRestart: false,
      isRequiringSteamGuard: false,
    })
    const sac2 = this.allUsersClientsStorage.addSteamAccountFrom0({
      accountName: accountName2,
      userId,
      username,
      planId: user.plan.id_plan,
      autoRestart: false,
      isRequiringSteamGuard: false,
    })
    const sac3 = this.allUsersClientsStorage.addSteamAccountFrom0({
      accountName: accountName3,
      userId,
      username,
      planId: user.plan.id_plan,
      autoRestart: false,
      isRequiringSteamGuard: false,
    })
    user.addSteamAccount(steamAccount)
    return {
      [`${prefix}`]: user,
      [`${prefix}SteamAccount`]: steamAccount,
      [`${prefix}SAC`]: sac,
      [`${prefix}SAC2`]: sac2,
      [`${prefix}SAC3`]: sac3,
    } as PrefixKeys<P>
  }
}

export function makeSteamAccount(ownerId: string, accountName: string) {
  const hashService = new HashService()
  const [error, encryptedPassword] = hashService.encrypt(password)

  if (error) throw error
  return SteamAccount.create({
    credentials: SteamAccountCredentials.create({
      accountName,
      password: encryptedPassword,
    }),
    idGenerator,
    ownerId,
  })
}
