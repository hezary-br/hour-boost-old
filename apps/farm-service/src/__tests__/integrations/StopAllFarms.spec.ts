import type { PlanInfinity, PlanUsage } from "core"
import { PlanBuilder } from "~/application/factories/PlanFactory"
import { StopAllFarms } from "~/application/use-cases/StopAllFarms"
import { PersistFarmSessionHandler } from "~/domain/handler/PersistFarmSessionHandler"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

import {
  CustomInstances,
  MakeTestInstancesProps,
  makeTestInstances,
  password,
  type PrefixKeys,
} from "~/__tests__/instances"

const validSteamAccounts = [
  { accountName: "paco", password },
  { accountName: "fred", password },
  { accountName: "bane", password },
]

const log = console.log
console.log = () => {}

let i = makeTestInstances({ validSteamAccounts })
let meInstances = {} as PrefixKeys<"me">
let friendInstances = {} as PrefixKeys<"friend">
let stopAllFarms: StopAllFarms

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  friendInstances = await i.createUser("friend")
  const diamondPlan = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(diamondPlan)
  await i.addSteamAccountInternally(s.me.userId, s.me.accountName2, password)
  stopAllFarms = new StopAllFarms(i.usersClusterStorage)
}

beforeEach(async () => {
  import.meta.jest
    .useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    .setSystemTime(new Date("2024-02-20T00:00:00.000Z"))
  await setupInstances({ validSteamAccounts })
})

afterEach(async () => {
  import.meta.jest.useRealTimers()
})

describe("2 infinity plan and 1 usage plan farming ", () => {
  beforeEach(async () => {
    await i.farmGamesController.handle({
      payload: { accountName: s.me.accountName, gamesID: [109230], userId: s.me.userId },
    })
    await i.farmGamesController.handle({
      payload: { accountName: s.me.accountName2, gamesID: [109230], userId: s.me.userId },
    })
    await i.farmGamesController.handle({
      payload: { accountName: s.friend.accountName, gamesID: [109230], userId: s.friend.userId },
    })

    i.publisher.register(
      new PersistFarmSessionHandler(i.planRepository, i.sacStateCacheRepository, i.allUsersClientsStorage)
    )
  })

  test("should list all users SACs but friend account 2, as farming", async () => {
    expect(i.allUsersClientsStorage.listUsers()).toStrictEqual({
      [s.me.userId]: {
        [s.me.accountName]: {
          farming: true,
          gamesPlaying: [109230],
          gamesStaging: [],
          logged: true,
          farmStartedAt: "2024-02-20T00:00:00.000Z",
          status: "online",
        },
        [s.me.accountName2]: {
          farming: true,
          gamesPlaying: [109230],
          gamesStaging: [],
          logged: true,
          farmStartedAt: "2024-02-20T00:00:00.000Z",
          status: "online",
        },
      },
      [s.friend.userId]: {
        [s.friend.accountName]: {
          farming: true,
          gamesPlaying: [109230],
          gamesStaging: [],
          logged: true,
          farmStartedAt: "2024-02-20T00:00:00.000Z",
          status: "online",
        },
        [s.friend.accountName2]: {
          farming: false,
          gamesPlaying: [],
          gamesStaging: [],
          logged: false,
          farmStartedAt: null,
          status: "online",
        },
      },
    })

    import.meta.jest.useRealTimers()
  })

  test("should list all users services as farming", async () => {
    expect(i.usersClusterStorage.getAccountsStatus()).toStrictEqual({
      [s.me.username]: {
        [s.me.accountName]: "FARMING",
        [s.me.accountName2]: "FARMING",
      },
      [s.friend.username]: {
        [s.friend.accountName]: "FARMING",
      },
    })
  })

  describe("Stopped all farms test suite", () => {
    let spyPublish: jest.SpyInstance
    beforeEach(async () => {
      spyPublish = import.meta.jest.spyOn(i.publisher, "publish")
      stopAllFarms.execute({ isFinalizingSession: false })
      await new Promise(setImmediate)
    })

    test("should list all users SACs as not farming", async () => {
      expect(i.allUsersClientsStorage.listUsers()).toStrictEqual({
        [s.me.userId]: {
          [s.me.accountName]: {
            farming: false,
            gamesPlaying: [],
            gamesStaging: [],
            logged: true,
            farmStartedAt: null,
            status: "online",
          },
          [s.me.accountName2]: {
            farming: false,
            gamesPlaying: [],
            gamesStaging: [],
            logged: true,
            farmStartedAt: null,
            status: "online",
          },
        },
        [s.friend.userId]: {
          [s.friend.accountName]: {
            farming: false,
            gamesPlaying: [],
            gamesStaging: [],
            logged: true,
            farmStartedAt: null,
            status: "online",
          },
          [s.friend.accountName2]: {
            farming: false,
            gamesPlaying: [],
            gamesStaging: [],
            logged: false,
            farmStartedAt: null,
            status: "online",
          },
        },
      })
    })

    test("should list all users services as not farming", async () => {
      expect(i.usersClusterStorage.getAccountsStatus()).toStrictEqual({
        [s.me.username]: {},
        [s.friend.username]: {
          [s.friend.accountName]: "IDDLE",
        },
      })
    })

    test("should persist usages on plan", async () => {
      // console.log = log
      const mePlan = (await i.planRepository.getById(meInstances.me.plan.id_plan)) as PlanInfinity
      const friendPlan = (await i.planRepository.getById(friendInstances.friend.plan.id_plan)) as PlanUsage
      expect(mePlan.usages.data).toHaveLength(2)
      expect(friendPlan.usages.data).toHaveLength(1)
    })
  })
})
