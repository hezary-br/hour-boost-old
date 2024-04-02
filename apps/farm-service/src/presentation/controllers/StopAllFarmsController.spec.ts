import { jest } from "@jest/globals"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { ensureExpectation } from "~/__tests__/utils"
import type { UserCompleteFarmSessionCommand } from "~/application/commands"
import { PlanBuilder } from "~/application/factories/PlanFactory"
import type { FarmSession } from "~/application/services"
import { StopAllFarms } from "~/application/use-cases"
import { PersistFarmSessionHandler } from "~/domain/handler/PersistFarmSessionHandler"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { StopAllFarmsController } from "~/presentation/controllers"
import { promiseHandler } from "~/presentation/controllers/promiseHandler"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let friendInstances = {} as PrefixKeys<"friend">
let stopAllFarmsUseCase: StopAllFarms
let stopAllFarmsController: StopAllFarmsController

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  friendInstances = await i.createUser("friend")
  stopAllFarmsUseCase = new StopAllFarms(i.usersClusterStorage)
  stopAllFarmsController = new StopAllFarmsController(stopAllFarmsUseCase)
}

const OLD_ENV = process.env
beforeEach(async () => {
  jest.resetModules()
  process.env = { ...OLD_ENV }
  process.env.ACTIONS_SECRET = "secret"
  await setupInstances({
    validSteamAccounts,
  })
  i.publisher.register(
    new PersistFarmSessionHandler(i.planRepository, i.sacStateCacheRepository, i.allUsersClientsStorage)
  )
})

afterEach(() => {
  i.publisher.observers = []
})

test("1xUser -> 2 Account (Infinity); should persist 2 usages of 2 hours", async () => {
  jest.useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
  const spyPublish = jest.spyOn(i.publisher, "publish")
  const diamondPlan = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(diamondPlan)
  await i.addSteamAccountInternally(s.me.userId, s.me.accountName2, password)

  const farmAccount1 = await promiseHandler(
    i.farmGamesController.handle({
      payload: { accountName: s.me.accountName, gamesID: [1090], userId: s.me.userId },
    })
  )
  const farmAccount2 = await promiseHandler(
    i.farmGamesController.handle({
      payload: { accountName: s.me.accountName2, gamesID: [1090], userId: s.me.userId },
    })
  )
  ensureExpectation(200, farmAccount1)
  ensureExpectation(200, farmAccount2)
  jest.advanceTimersByTime(3600 * 1000 * 1.5)
  await promiseHandler(stopAllFarmsController.handle({ payload: { secret: "secret" } }))
  await new Promise(setImmediate)
  console.log({ observes: i.publisher.observers })
  const infinityUsages = spyPublish.mock.calls
    .filter(([call]) => call.operation === "user-complete-farm-session-infinity")
    .flat(1)

  console.log({ infinityUsages })

  const mePlan = await i.planRepository.getById(diamondPlan.id_plan)
  const [usageAccount1, usageAccount2] = mePlan?.usages.data ?? []
  expect(mePlan?.usages.data).toHaveLength(2)
  expect(usageAccount1.accountName).toBe(s.me.accountName)
  expect(usageAccount2.accountName).toBe(s.me.accountName2)
  expect(usageAccount1.amountTime).toBe(5400)
  expect(usageAccount2.amountTime).toBe(5400)
  jest.useRealTimers()
})

describe("Start 2 farming, and stop all farms test suite", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test("should call stop method of all farm services", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout", "setImmediate"] })
    const diamondPlan = new PlanBuilder(s.me.userId).infinity().diamond()
    await i.changeUserPlan(diamondPlan)

    const spyPublish = jest.spyOn(i.publisher, "publish")
    await promiseHandler(
      i.farmGamesController.handle({
        payload: { accountName: s.me.accountName, gamesID: [1090], userId: s.me.userId },
      })
    )
    await promiseHandler(
      i.farmGamesController.handle({
        payload: { accountName: s.me.accountName2, gamesID: [1090], userId: s.me.userId },
      })
    )
    jest.advanceTimersByTime(3600 * 1000 * 2)
    const spyFriendStopFarmAllAccounts = jest.spyOn(
      i.usersClusterStorage.getOrThrow(s.me.username),
      "stopFarmAllAccounts"
    )

    await promiseHandler(stopAllFarmsController.handle({ payload: { secret: "secret" } }))
    await new Promise(setImmediate)

    jest.useRealTimers()
  })

  test.only("2xUser -> 1 Account; should publish 2 usages of 2 hours", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout", "setImmediate"] })
    const spyPublish = jest.spyOn(i.publisher, "publish")

    await promiseHandler(
      i.farmGamesController.handle({
        payload: { accountName: s.me.accountName, gamesID: [1090], userId: s.me.userId },
      })
    )
    await promiseHandler(
      i.farmGamesController.handle({
        payload: { accountName: s.friend.accountName, gamesID: [1090], userId: s.friend.userId },
      })
    )
    jest.advanceTimersByTime(3600 * 1000 * 2)

    await promiseHandler(stopAllFarmsController.handle({ payload: { secret: "secret" } }))

    const usagesCommands = spyPublish.mock.calls
      .filter(([call]) => call.operation === "user-complete-farm-session")
      .flat(1)

    expect(usagesCommands).toHaveLength(2)
    const [meCommand, friendCommand] = usagesCommands as UserCompleteFarmSessionCommand[]
    expect(meCommand.farmSession).toStrictEqual({
      type: "STOP-ALL",
      accountNameList: [s.me.accountName],
      planId: meInstances.me.plan.id_plan,
      usages: expect.arrayContaining([
        expect.objectContaining({
          accountName: s.me.accountName,
          amountTime: 7200,
        }),
      ]),
    })
    expect(friendCommand.farmSession).toStrictEqual({
      type: "STOP-ALL",
      accountNameList: [s.friend.accountName],
      planId: friendInstances.friend.plan.id_plan,
      usages: expect.arrayContaining([
        expect.objectContaining({
          accountName: s.friend.accountName,
          amountTime: 7200,
        }),
      ]),
    } satisfies FarmSession)
    jest.useRealTimers()
  })

  test("2xUser -> 1 Account; should have persisted two new usages with 2 hours of usage", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout", "setImmediate"] })
    const spyPublish = jest.spyOn(i.publisher, "publish")

    await promiseHandler(
      i.farmGamesController.handle({
        payload: { accountName: s.me.accountName, gamesID: [1090], userId: s.me.userId },
      })
    )
    await promiseHandler(
      i.farmGamesController.handle({
        payload: { accountName: s.friend.accountName, gamesID: [1090], userId: s.friend.userId },
      })
    )
    jest.advanceTimersByTime(3600 * 1000 * 2)

    await promiseHandler(stopAllFarmsController.handle({ payload: { secret: "secret" } }))
    await new Promise(setImmediate)

    console.log({
      observers: i.publisher.observers,
      calls: spyPublish.mock.calls,
    })

    const mePlan = await i.planRepository.getById(meInstances.me.plan.id_plan)
    expect(mePlan?.usages.data).toHaveLength(1)
    expect(mePlan?.usages.data[0].amountTime).toBe(7200)

    const friendPlan = await i.planRepository.getById(friendInstances.friend.plan.id_plan)
    expect(friendPlan?.usages.data).toHaveLength(1)
    expect(friendPlan?.usages.data[0].amountTime).toBe(7200)
    jest.useRealTimers()
  })
})
