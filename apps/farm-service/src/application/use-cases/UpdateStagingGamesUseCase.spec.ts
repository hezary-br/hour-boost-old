import {
  type CustomInstances,
  type MakeTestInstancesProps,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { AutoRestartCron } from "~/application/cron/AutoRestartCron"
import {
  CreateUserUseCase,
  RestoreAccountConnectionUseCase,
  RestoreAccountSessionUseCase,
  UpdateStagingGamesUseCase,
} from "~/application/use-cases"
import { StagingGamesListService } from "~/domain/services"

import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

const log = console.log
console.log = () => {}

let autoRestartCron: AutoRestartCron
let i = makeTestInstances({
  validSteamAccounts,
})

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  const createUser = new CreateUserUseCase(
    i.usersRepository,
    i.userAuthentication,
    i.usersClusterStorage,
    i.initUserGateway
  )
  await createUser.execute(s.me.userId)
  await i.addSteamAccountInternally(s.me.userId, s.me.accountName, password)
  const restoreAccountConnectionUseCase = new RestoreAccountConnectionUseCase(
    i.allUsersClientsStorage,
    i.usersClusterStorage,
    i.sacStateCacheRepository,
    i.hashService
  )
  const restoreAccountSessionUseCase = new RestoreAccountSessionUseCase(i.usersClusterStorage, i.publisher)
  autoRestartCron = new AutoRestartCron(
    i.allUsersClientsStorage,
    i.planRepository,
    i.steamAccountsRepository,
    restoreAccountConnectionUseCase,
    restoreAccountSessionUseCase,
    i.usersDAO,
    i.sacStateCacheRepository
  )
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

describe("UpdateStagingGamesUseCase test suite", () => {
  test("should update the staging games", async () => {
    await restoreAccountSession(s.me.accountName)

    const stagingGamesListService = new StagingGamesListService()
    const updateStagingGamesUseCase = new UpdateStagingGamesUseCase(
      stagingGamesListService,
      i.usersClusterStorage,
      i.usersRepository,
      i.sacStateCacheRepository,
      i.allUsersClientsStorage
    )
    console.log = log
    console.log({ accountStates: Array.from(i.sacCacheInMemory.state.keys()) })
    const SACStateCache = await i.sacStateCacheRepository.get(s.me.accountName)
    expect(SACStateCache).not.toBeNull()
    expect(SACStateCache?.gamesStaging).toStrictEqual([])

    const [error, result] = await updateStagingGamesUseCase.execute({
      accountName: s.me.accountName,
      newGameList: [722],
      userId: s.me.userId,
    })

    expect(error).toBeNull()
    expect(result?.gamesStaging).toStrictEqual([722])

    /**
     * Persist
     */
    const SACStateCache_2 = await i.sacStateCacheRepository.get(s.me.accountName)
    expect(SACStateCache_2?.gamesStaging).toStrictEqual([722])

    /**
     * Clean staging games
     */
    const [error_2, result_2] = await updateStagingGamesUseCase.execute({
      accountName: s.me.accountName,
      newGameList: [],
      userId: s.me.userId,
    })
    expect(error_2).toBeNull()
    expect(result_2?.gamesStaging).toStrictEqual([])
    const SACStateCache_3 = await i.sacStateCacheRepository.get(s.me.accountName)
    expect(SACStateCache_3?.gamesStaging).toStrictEqual([])
  })

  test("should error if user stage more game than his plan allows", async () => {
    await restoreAccountSession(s.me.accountName)

    const stagingGamesListService = new StagingGamesListService()
    const updateStagingGamesUseCase = new UpdateStagingGamesUseCase(
      stagingGamesListService,
      i.usersClusterStorage,
      i.usersRepository,
      i.sacStateCacheRepository,
      i.allUsersClientsStorage
    )

    const [error, result] = await updateStagingGamesUseCase.execute({
      accountName: s.me.accountName,
      newGameList: [722, 511],
      userId: s.me.userId,
    })

    expect(error?.code).toBe("[Staging-Games-List-Service]:STAGE-MORE-GAMES-THAN-PLAN-ALLOWS")
    expect(result).toBeUndefined()
  })
})

async function restoreAccountSession(accountName: string) {
  await autoRestartCron.run({
    accountName,
    forceRestoreSessionOnApplication: true,
  })
}
