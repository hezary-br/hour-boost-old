import { PlanUsage } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { RestoreUsersSessionsUseCase } from "~/application/use-cases/RestoreUsersSessionsUseCase"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  // @ts-ignore
  globalThis["usersMemory"] = i.usersMemory
  meInstances = await i.makeUserInstances("me", s.me)

  const restoreUsersSessionsUseCase = new RestoreUsersSessionsUseCase(i.usersClusterStorage)
  const users = await i.usersRepository.findMany()
  restoreUsersSessionsUseCase.execute({ users })
}

beforeEach(async () => {
  // console.log = () => {}
  await setupInstances({
    validSteamAccounts,
  })
  // console.log = log
})

test("should change usage plan to CUSTOM usage plan and increase max steamAccounts allowed to 2x", async () => {
  const userPlan = await i.planRepository.getById(meInstances.me.plan.id_plan)
  expect(userPlan).toBeInstanceOf(PlanUsage)
  expect(userPlan?.custom).toBe(false)
  expect(userPlan?.maxSteamAccounts).toBe(1)

  const [error] = await i.setMaxSteamAccountsUseCase.execute({
    mutatingUserId: s.me.userId,
    newMaxSteamAccountsAllowed: 2,
  })
  expect(error).toBeNull()

  const userPlan2 = await i.planRepository.getById(meInstances.me.plan.id_plan)
  expect(userPlan2?.custom).toBe(true)
  expect(userPlan2?.maxSteamAccounts).toBe(2)
})

test("should persist usages when trimming extra account after decreasing max steam accounts", async () => {
  const [_error] = await i.setMaxSteamAccountsUseCase.execute({
    mutatingUserId: s.me.userId,
    newMaxSteamAccountsAllowed: 2,
  })
  expect(_error).toBeNull()

  const [errorRegistering] = await registerAccount(s.me.accountName)
  expect(errorRegistering).toBeNull()
  const [errorRegistering2] = await registerAccount(s.me.accountName2)
  expect(errorRegistering2).toBeNull()
  const farmGamesResponse = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse.status).toBe(200)
  const farmGamesResponse2 = await i.farmGames(s.me.accountName2, [100], s.me.userId)
  expect(farmGamesResponse2.status).toBe(200)
  const user = await i.usersRepository.getByID(s.me.userId)
  expect(user?.steamAccounts.data).toHaveLength(2)

  const accountsStatus = i.usersClusterStorage.getAccountsStatus()
  expect(user?.plan.usages.data).toHaveLength(0)
  expect(accountsStatus).toStrictEqual({
    [s.me.username]: { [s.me.accountName]: "FARMING", [s.me.accountName2]: "FARMING" },
  })
  expect(user?.steamAccounts.data).toHaveLength(2)

  const [error] = await i.setMaxSteamAccountsUseCase.execute({
    mutatingUserId: s.me.userId,
    newMaxSteamAccountsAllowed: 1,
  })
  const user2 = await i.usersRepository.getByID(s.me.userId)
  expect(user2?.steamAccounts.data).toHaveLength(1)
  expect(error).toBeNull()
  const accountsStatus2 = i.usersClusterStorage.getAccountsStatus()
  // 1 comes from removed account, and other one comes
  // from restarting the farm of the remaining
  expect(user2?.plan.usages.data).toHaveLength(2)
  expect(accountsStatus2).toStrictEqual({
    [s.me.username]: { [s.me.accountName]: "FARMING" },
  })
})

const registerAccount = (accountName: string) =>
  i.addSteamAccountUseCase.execute({
    accountName,
    password,
    userId: s.me.userId,
  })
