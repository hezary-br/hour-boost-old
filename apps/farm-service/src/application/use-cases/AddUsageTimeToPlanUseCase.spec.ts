import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { RestoreUsersSessionsUseCase } from "~/application/use-cases/RestoreUsersSessionsUseCase"
import { PersistFarmSessionHandler } from "~/domain/handler"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { AddUsageTimeToPlanUseCase } from "./AddUsageTimeToPlanUseCase"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let addUsageTimeToPlanUseCase: AddUsageTimeToPlanUseCase

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.makeUserInstances("me", s.me)

  const [errorAddingAccount] = await i.addSteamAccountUseCase.execute({
    accountName: s.me.accountName,
    password: password,
    userId: s.me.userId,
  })
  expect(errorAddingAccount).toBeNull()
  const restoreUsersSessionsUseCase = new RestoreUsersSessionsUseCase(i.usersClusterStorage)
  const users = await i.usersRepository.findMany()
  restoreUsersSessionsUseCase.execute({ users })
  i.publisher.register(
    new PersistFarmSessionHandler(i.planRepository, i.sacStateCacheRepository, i.allUsersClientsStorage)
  )
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

test("should farm 6 hours, stop, try again and FAIL", async () => {
  Object.assign(globalThis, { __allUsersClientsStorage: i.allUsersClientsStorage })
  // Object.assign(globalThis, { __usersClusterStorage: i.usersClusterStorage })
  import.meta.jest
    .useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    .setSystemTime(new Date("2024-02-20T00:00:00.000Z"))

  const user = await i.usersRepository.getByID(s.me.userId)
  if (!user) throw user
  expect(user.plan.name).toBe("GUEST")
  expect(user.plan.usages.data.at(0)).toBeUndefined()
  const farmGamesResponse = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse.status).toBe(200)
  const accountStatus = () => i.usersClusterStorage.getAccountsStatus()
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "FARMING",
    },
  })
  import.meta.jest.advanceTimersByTime(1000 * 60 * 60 * 7)
  await new Promise(setImmediate)
  const user2 = await i.usersRepository.getByID(s.me.userId)
  if (!user2) throw user2
  expect(user2.plan.usages.data.at(0)).toMatchObject(
    expect.objectContaining({
      amountTime: 21600,
    })
  )
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "IDDLE",
    },
  })

  // const [error] = await i.addUsageTimeToPlanUseCase.execute({
  //   mutatingUserId: s.me.userId,
  //   usageTimeInSeconds: 60 * 5,
  // })
  // expect(error).toBeNull()

  const farmGamesResponse2 = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse2.json.message).toBe("Seu plano não possui mais uso disponível.")
})

test("should farm 6 hours, stop, increase max usage time, try again and SUCCEED", async () => {
  Object.assign(globalThis, { __allUsersClientsStorage: i.allUsersClientsStorage })
  import.meta.jest
    .useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    .setSystemTime(new Date("2024-02-20T00:00:00.000Z"))

  const user = await i.usersRepository.getByID(s.me.userId)
  if (!user) throw user
  const farmGamesResponse = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse.status).toBe(200)
  const accountStatus = () => i.usersClusterStorage.getAccountsStatus()
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "FARMING",
    },
  })
  import.meta.jest.advanceTimersByTime(1000 * 60 * 60 * 7)
  await new Promise(setImmediate)
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "IDDLE",
    },
  })

  const [error] = await i.addUsageTimeToPlanUseCase.execute({
    mutatingUserId: s.me.userId,
    usageTimeInSeconds: 60 * 5,
  })
  expect(error).toBeNull()

  const farmGamesResponse2 = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse2.json.message).toBe("Iniciando farm.")
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "FARMING",
    },
  })
})

test("should farm 6 hours, stop, increase max usage time, try again, SUCCEED, then farm more 5 minutes and STOP", async () => {
  import.meta.jest
    .useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    .setSystemTime(new Date("2024-02-20T00:00:00.000Z"))

  const user = await i.usersRepository.getByID(s.me.userId)
  if (!user) throw user
  expect(user.plan.usages.data.at(0)).toBeUndefined()
  const farmGamesResponse = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse.status).toBe(200)
  const accountStatus = () => i.usersClusterStorage.getAccountsStatus()
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "FARMING",
    },
  })
  import.meta.jest.advanceTimersByTime(1000 * 60 * 60 * 7)
  await new Promise(setImmediate)
  const user2 = await i.usersRepository.getByID(s.me.userId)
  if (!user2) throw user2
  expect(user2.plan.usages.data.at(0)).toMatchObject(
    expect.objectContaining({
      amountTime: 21600,
    })
  )
  expect(user2.plan.usages.data.at(1)).toBeUndefined()
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "IDDLE",
    },
  })

  const [error] = await i.addUsageTimeToPlanUseCase.execute({
    mutatingUserId: s.me.userId,
    usageTimeInSeconds: 60 * 5,
  })
  expect(error).toBeNull()

  const farmGamesResponse2 = await i.farmGames(s.me.accountName, [100], s.me.userId)
  expect(farmGamesResponse2.json.message).toBe("Iniciando farm.")
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "FARMING",
    },
  })
  import.meta.jest.advanceTimersByTime(1000 * 60 * 7)
  await new Promise(setImmediate)
  // await new Promise(res => setTimeout(res, 500))
  const user3 = await i.usersRepository.getByID(s.me.userId)
  if (!user3) throw user3
  expect(accountStatus()).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "IDDLE",
    },
  })
  expect(user3.plan.usages.data.at(0)).toMatchObject(
    expect.objectContaining({
      amountTime: 21600,
    })
  )
  expect(user3.plan.usages.data.at(1)).toMatchObject(
    expect.objectContaining({
      amountTime: 300,
    })
  )
})
