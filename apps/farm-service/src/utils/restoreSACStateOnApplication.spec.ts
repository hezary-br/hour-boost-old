import { CacheState, type CacheStateDTO } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  validSteamAccounts,
} from "~/__tests__/instances"
import { RestoreAccountConnectionUseCase } from "~/application/use-cases"
import {
  type TEST_RestoreAccountConnection,
  makeRestoreAccountConnection,
} from "~/application/use-cases/__tests_helpers"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { restoreSACStateOnApplication } from "./restoreSACStateOnApplication"

const log = console.log
console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let restoreAccountConnection: TEST_RestoreAccountConnection

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")

  const restoreAccountConnectionUseCase = new RestoreAccountConnectionUseCase(
    i.allUsersClientsStorage,
    i.usersClusterStorage,
    i.sacStateCacheRepository,
    i.hashService
  )

  restoreAccountConnection = makeRestoreAccountConnection(restoreAccountConnectionUseCase, i.usersRepository)
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

test("should restore session if user is not farming", async () => {
  await restoreAccountConnection(s.me.userId, s.me.accountName)
  await i.planRepository.update(meInstances.me.plan)
  const [error, userCluster] = i.usersClusterStorage.get(s.me.username)!
  expect(error).toBeNull()
  const restore = restoreSACStateOnApplication(userCluster!, null)
  const sac = i.allUsersClientsStorage.getAccountClient(s.me.userId, s.me.accountName)!
  const dto: CacheStateDTO = {
    accountName: s.me.accountName,
    farmStartedAt: null,
    gamesPlaying: [],
    gamesStaging: [100],
    isFarming: false,
    planId: meInstances.me.plan.id_plan,
    status: "online",
    username: s.me.username,
  }
  const state = CacheState.restoreFromDTO(dto)
  const [errorRestoring] = await restore(sac, state)
  expect(errorRestoring).toBeNull()
  expect(sac.getCache().toDTO()).toStrictEqual(dto)
})
