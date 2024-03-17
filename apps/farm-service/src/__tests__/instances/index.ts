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
import { AddSteamAccountUseCase, CheckSteamAccountOwnerStatusUseCase } from "~/application/use-cases"
import { CreateUserUseCase } from "~/application/use-cases/CreateUserUseCase"
import { FarmGamesUseCase } from "~/application/use-cases/FarmGamesUseCase"
import { StopFarmUseCase } from "~/application/use-cases/StopFarmUseCase"
import { AutoRestarterScheduler } from "~/domain/cron"
import { PlanService } from "~/domain/services/PlanService"
import { UserService } from "~/domain/services/UserService"
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
import { SACStateCacheBuilder } from "~/utils/builders/SACStateCacheBuilder"
import { SteamUserMockBuilder } from "~/utils/builders/SteamMockBuilder"
import { UsageBuilder } from "~/utils/builders/UsageBuilder"
import { UserClusterBuilder } from "~/utils/builders/UserClusterBuilder"

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
  const sacStateCacheRepository = new SteamAccountClientStateCacheInMemory(sacCacheInMemory)
  const usageBuilder = new UsageBuilder()
  const sacStateCacheBuilder = new SACStateCacheBuilder()
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
    sacStateCacheRepository,
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
  const stopFarmUseCase = new StopFarmUseCase(usersClusterStorage, planRepository)
  const farmGamesUseCase = new FarmGamesUseCase(usersClusterStorage)
  const checkSteamAccountOwnerStatusUseCase = new CheckSteamAccountOwnerStatusUseCase(steamAccountsRepository)
  const hashService = new HashService()
  const allUsersClientsStorage = new AllUsersClientsStorage(
    sacBuilder,
    sacStateCacheRepository,
    farmGamesUseCase,
    planRepository,
    publisher
  )
  const userAuthentication = new UserAuthenticationInMemory()
  const sacFactory = makeSACFactory(validSteamAccounts, publisher)
  const createUserUseCase = new CreateUserUseCase(usersRepository, userAuthentication, usersClusterStorage)

  const addSteamAccount = new AddSteamAccount(usersRepository, steamAccountsRepository, idGenerator)
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
  })

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
    const steamAccount = SteamAccount.restore({
      credentials: SteamAccountCredentials.restore({
        accountName,
        password,
      }),
      id_steamAccount: id_steamAccount ?? idGenerator.makeID(),
      ownerId: userId,
      autoRelogin: true,
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
    sacStateCacheBuilder,
    sacBuilder,
    usersDAO,
    steamAccountsDAO,
    usersRepository,
    sacStateCacheRepository,
    steamAccountsRepository,
    planRepository,
    stopFarmUseCase,
    farmGamesUseCase,
    addSteamAccountUseCase,
    checkSteamAccountOwnerStatusUseCase,
    redis,
    planService,
    userService,
    hashService,
    idGenerator,
    userAuthentication,
    farmGamesController,
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
}

interface IUserInstancesBuilder {
  create<P extends TestUsers>(prefix: P, testUsersProps: TestUserProperties, user: User): PrefixKeys<P>
}

class UserInstancesBuilder implements IUserInstancesBuilder {
  constructor(private readonly allUsersClientsStorage: AllUsersClientsStorage) {}

  create<P extends TestUsers>(
    prefix: P,
    { accountName, userId, username, accountName2 }: TestUserProperties,
    user: User
  ): PrefixKeys<P> {
    const steamAccount = makeSteamAccount(user.id_user, accountName)
    const sac = this.allUsersClientsStorage.addSteamAccountFrom0({
      accountName,
      userId,
      username,
      planId: user.plan.id_plan,
      autoRestart: false,
    })
    const sac2 = this.allUsersClientsStorage.addSteamAccountFrom0({
      accountName: accountName2,
      userId,
      username,
      planId: user.plan.id_plan,
      autoRestart: false,
    })
    user.addSteamAccount(steamAccount)
    return {
      [`${prefix}`]: user,
      [`${prefix}SteamAccount`]: steamAccount,
      [`${prefix}SAC`]: sac,
      [`${prefix}SAC2`]: sac2,
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
