import { jest } from "@jest/globals"
import { GuestPlan, PlanUsage, Usage } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  validSteamAccounts,
} from "~/__tests__/instances"
import { ensureExpectation } from "~/__tests__/utils"
import type { UserCompleteFarmSessionCommand } from "~/application/commands"
import { PlanBuilder } from "~/application/factories/PlanFactory"
import { PersistFarmSessionHandler } from "~/domain/handler/PersistFarmSessionHandler"
import type { Observer } from "~/infra/queue"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { StopFarmController, promiseHandler } from "~/presentation/controllers"
import { SteamUserMockBuilder } from "~/utils/builders"
jest.setTimeout(1000)

const now = new Date("2023-06-10T10:00:00Z")
const log = console.log

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let stopFarmController: StopFarmController

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  stopFarmController = new StopFarmController(i.stopFarmUseCase, i.usersRepository)
}

describe("mobile", () => {
  console.log = () => {}

  beforeEach(async () => {
    await setupInstances(
      {
        validSteamAccounts,
      },
      {
        steamUserBuilder: new SteamUserMockBuilder(validSteamAccounts, true),
      }
    )
  })
  console.log = log

  test("should ask for steam guard if the account has mobile steam guard", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 202,
      json: { message: "Steam Guard requerido. Enviando para seu celular." },
    })
  })
})

describe("not mobile", () => {
  console.log = () => {}

  beforeEach(async () => {
    await setupInstances({
      validSteamAccounts,
    })
    i.publisher.register(
      new PersistFarmSessionHandler(i.planRepository, i.sacStateCacheRepository, i.allUsersClientsStorage)
    )
    i.publisher.register(createLogPersistFarmSessionHandler())
  })
  // console.log = log

  test("should start the farm", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 200,
      json: { message: "Iniciando farm." },
    })
  })

  test("should update the farming games", async () => {
    // import.meta.jest.useFakeTimers({ doNotFake: ["setTimeout", "setImmediate"] })
    // console.log = () => {}

    const diamondPlan = new PlanBuilder(s.me.userId).infinity().diamond()
    await i.changeUserPlan(diamondPlan)

    const responseFarmGames = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(responseFarmGames.status).toBe(200)

    // console.log = log
    const responseUpdateGames = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892, 708],
        },
      })
    )

    const accountCacheStatus = await i.sacStateCacheRepository.get(s.me.accountName)
    expect(accountCacheStatus?.gamesPlaying).toStrictEqual([10892, 708])

    expect(responseUpdateGames).toStrictEqual({
      status: 200,
      json: { message: "Farm atualizado." },
    })
  }, 2000)

  test("should return 404 when not registered user is provided", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: "RANDOM_ID_SDFIWI",
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 404,
      json: {
        message: "Usuário não encontrado.",
      },
    })
  })

  test("should reject if steam account don't exists", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: "RANDOM_STEAM_ACCOUNT_ID",
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 400,
      json: {
        message: "Steam Account nunca foi registrada ou ela não pertence à você.",
      },
    })
  })

  test("should reject if the provided plan is type usage and don't have more usage left", async () => {
    const reachedPlan = GuestPlan.create({
      ownerId: s.me.userId,
    })
    const allUsage = Usage.create({
      amountTime: 21600,
      createdAt: new Date("2023-06-10T10:00:00Z"),
      user_id: s.me.userId,
      plan_id: reachedPlan.id_plan,
      accountName: s.me.accountName,
    })
    reachedPlan.use(allUsage)
    const me = await i.usersRepository.getByID(s.me.userId)
    if (!me || !(me.plan instanceof PlanUsage)) throw new Error()
    me.plan.use(allUsage)
    await i.usersRepository.update(me)
    const dbUser = await i.usersRepository.getByID(s.me.userId)
    expect(dbUser?.steamAccounts.data).toHaveLength(1)
    expect(dbUser?.plan).toBeInstanceOf(GuestPlan)
    expect((dbUser?.plan as PlanUsage).getUsageLeft()).toBe(0)
    expect((dbUser?.plan as PlanUsage).getUsageTotal()).toBe(21600)
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 403,
      json: {
        message: "Seu plano não possui mais uso disponível.",
      },
    })
  })

  // IMPLEMENTAR FARM INFINITY

  // test("should run the farm if the plan is type infinity", async () => {
  //   me.assignPlan(
  //     SilverPlan.create({
  //       ownerId: me.id_user,
  //     })
  //   )
  //   await i.usersRepository.update(me)
  //   const response = await promiseHandler(
  //     startFarmController.handle({
  //       payload: {
  //         userId: s.me.userId,
  //         accountName: s.me.accountName,
  //         gamesID: [10892],
  //       },
  //     })
  //   )

  //   expect(response).toStrictEqual({
  //     status: 200,
  //     json: { message: "Iniciando farm." },
  //   })
  // })

  test("should return message informing if no new games were added", async () => {
    const response1 = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response1).toStrictEqual({
      status: 200,
      json: { message: "Iniciando farm." },
    })

    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 200,
      json: {
        message: "Nenhum novo game adicionado ao farm.",
      },
    })
  })

  test("should REJECT if user attempts for farm more games than his plan allows", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 403,
      json: {
        message: "Seu plano não permite o farm de mais do que 1 jogo por vez.",
      },
    })
  })

  test("should retrieve the credentials info from database, login and start farm", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 200,
      json: { message: "Iniciando farm." },
    })
  })

  test("should NOT call the farm on client when plan has no usage left", async () => {
    const user = meInstances.me
    const allUsage = Usage.create({
      amountTime: 21600,
      createdAt: new Date("2023-06-10T10:00:00Z"),
      user_id: s.me.userId,
      plan_id: user.plan.id_plan,
      accountName: s.me.accountName,
    })

    await i.usePlan(s.me.userId, allUsage)

    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: user.id_user,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    const userClients = i.allUsersClientsStorage.getOrThrow(user.id_user)
    const sac = userClients.getAccountClientOrThrow(s.me.accountName)
    const spyFarmGames = jest.spyOn(sac, "farmGames")

    expect(spyFarmGames).not.toHaveBeenCalledWith([10892])

    expect(response).toStrictEqual({
      status: 403,
      json: { message: "Seu plano não possui mais uso disponível." },
    })
  })

  test("should return message saying user has run out of his plan max usage before steam guard is required", async () => {
    const user = meInstances.me
    const allUsage = Usage.create({
      amountTime: 21600,
      createdAt: new Date("2023-06-10T10:00:00Z"),
      user_id: s.me.userId,
      plan_id: user.plan.id_plan,
      accountName: s.me.accountName,
    })

    await i.usePlan(s.me.userId, allUsage)

    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: user.id_user,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    const userClients = i.allUsersClientsStorage.getOrThrow(user.id_user)
    const sac = userClients.getAccountClientOrThrow(s.me.accountName)
    const spyFarmGames = jest.spyOn(sac, "farmGames")

    expect(spyFarmGames).not.toHaveBeenCalledWith([10892])

    expect(response).toStrictEqual({
      status: 403,
      json: { message: "Seu plano não possui mais uso disponível." },
    })
  })

  test("should ALWAYS have the latest usage left value when user attempts to farm", async () => {
    const maxGuestPlanUsage = Usage.restore({
      id_usage: "max_guest_plan_usage",
      accountName: s.me.accountName,
      amountTime: 21600,
      createdAt: now,
      plan_id: meInstances.me.plan.id_plan,
      user_id: s.me.userId,
    })
    await i.usePlan(s.me.userId, maxGuestPlanUsage)
    const me = await i.usersRepository.getByID(s.me.userId)
    if (!me) throw "user not found"
    expect((me.plan as PlanUsage).getUsageLeft()).toBe(0)
    expect((me.plan as PlanUsage).getUsageTotal()).toBe(21600)

    const res = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )
    console.log(res)

    const me2 = await i.usersRepository.getByID(s.me.userId)
    if (!me2) throw new Error("User not found.")
    ;(me2.plan as PlanUsage).removeUsage("max_guest_plan_usage")
    await i.usersRepository.update(me2)

    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    const me3 = (await i.usersRepository.getByID(s.me.userId))!
    expect((me3.plan as PlanUsage).getUsageLeft()).toBe(21600)
    expect((me3.plan as PlanUsage).getUsageTotal()).toBe(0)
    expect(response.json?.message).toBe("Iniciando farm.")
  })

  test("should NOT ADD new SAC if the account already exists on storage and is not farming", async () => {
    await i.sacStateCacheRepository.flushAll()
    const responseFarm1 = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )
    expect(responseFarm1.status).toBe(200)

    const userCluster = i.usersClusterStorage.getOrThrow(s.me.username)
    const addSacSPY = jest.spyOn(userCluster, "addSAC")
    expect(addSacSPY).toBeTruthy()

    const responseStopFarm1 = await promiseHandler(
      stopFarmController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
        },
      })
    )
    expect(responseStopFarm1.status).toBe(200)

    const responseFarm2 = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )
    expect(responseFarm2.status).toBe(200)
  })

  // test("should start farm", async () => {
  //   jest.useFakeTimers({ doNotFake: ["setTimeout"] })
  //   const spyPublish = jest.spyOn(i.publisher, "publish")
  //   const promise i.= farmGamesController.handle({
  //     payload: {
  //       userId: s.me.userId,
  //       accountName: s.me.accountName,
  //       gamesID: [10892],
  //     },
  //   })

  //   await promiseHandler(promise)
  //   // jest.useFakeTimers()

  //   jest.advanceTimersByTime(2 * 60 * 60 * 1000)

  //   await promiseHandler(
  //     stopFarmController.handle({
  //       payload: {
  //         accountName: s.me.accountName,
  //         userId: s.me.userId,
  //       },
  //     })
  //   )

  //   const calls = spyPublish.mock.calls
  //     .filter(c => c[0].operation === "user-complete-farm-session-usage")
  //     .map(c =>
  //       (c[0] as UserCompletedFarmSessionUsageCommand).farmingAccountDetails.map(c => ({
  //         usageAmountInSeconds: c.usageAmountInSeconds,
  //         accountName: c.accountName,
  //       }))
  //     )
  //     .flat(Infinity)

  //   console.log({
  //     calls,
  //   })
  // })

  test("should farm with type plan USAGE and persist", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    const responseFarm1 = await promiseHandler(
      i.farmGamesController.handle({
        payload: { userId: s.me.userId, accountName: s.me.accountName, gamesID: [10892] },
      })
    )
    ensureExpectation(200, responseFarm1)
    jest.advanceTimersByTime(3600 * 1000 * 3)
    const responseStop1 = await promiseHandler(
      stopFarmController.handle({ payload: { accountName: s.me.accountName, userId: s.me.userId } })
    )
    ensureExpectation(200, responseStop1)
    await new Promise(setImmediate)

    const mePlan = (await i.planRepository.getById(meInstances.me.plan.id_plan)) as PlanUsage
    const [usage] = mePlan?.usages.data ?? []
    expect(mePlan.getUsageLeft()).toBe(10800) // special
    expect(mePlan?.usages.data).toHaveLength(1)
    expect(mePlan?.usages.data).toHaveLength(1)
    expect(usage.accountName).toBe(s.me.accountName)
    expect(usage.amountTime).toBe(10800)
  })

  test("should farm with type plan INFINITY and persist", async () => {
    const diamondPlan = new PlanBuilder(s.me.userId).infinity().diamond()
    await i.changeUserPlan(diamondPlan)

    jest.useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    const responseFarm1 = await promiseHandler(
      i.farmGamesController.handle({
        payload: { userId: s.me.userId, accountName: s.me.accountName, gamesID: [10892] },
      })
    )
    ensureExpectation(200, responseFarm1)
    // jest.advanceTimersByTime(3600 * 1000 * 3)
    // const responseStop1 = await promiseHandler(
    //   stopFarmController.handle({ payload: { accountName: s.me.accountName, userId: s.me.userId } })
    // )
    // ensureExpectation(200, responseStop1)
    // await new Promise(setImmediate)

    // const mePlan = await i.planRepository.getById(meInstances.me.plan.id_plan)
    // const [usage] = mePlan?.usages.data ?? []

    // expect(mePlan?.usages.data).toHaveLength(1)
    // expect(usage.accountName).toBe(s.me.accountName)
    // expect(usage.amountTime).toBe(10800)
  })

  test("should log the amount time when persist USAGE farm session", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    const responseFarm1 = await promiseHandler(
      i.farmGamesController.handle({
        payload: { userId: s.me.userId, accountName: s.me.accountName, gamesID: [10892] },
      })
    )
    ensureExpectation(200, responseFarm1)
    jest.advanceTimersByTime(3600 * 1000 * 3)
    const responseStop1 = await promiseHandler(
      stopFarmController.handle({ payload: { accountName: s.me.accountName, userId: s.me.userId } })
    )
    ensureExpectation(200, responseStop1)

    const mePlan = (await i.planRepository.getById(meInstances.me.plan.id_plan)) as PlanUsage
    const usages = mePlan?.usages.data
    expect(usages).toHaveLength(1)
    expect(usages[0].accountName).toBe(s.me.accountName)
    expect(usages[0].amountTime).toBe(3600 * 3)
  })
})

test("should log the amount time when persist INFINITY farm session", async () => {
  await setupInstances({
    validSteamAccounts,
  })
  i.publisher.register(
    new PersistFarmSessionHandler(i.planRepository, i.sacStateCacheRepository, i.allUsersClientsStorage)
  )

  const diamondPlan = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(diamondPlan)

  jest.useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
  const responseFarm1 = await promiseHandler(
    i.farmGamesController.handle({
      payload: { userId: s.me.userId, accountName: s.me.accountName, gamesID: [10892] },
    })
  )
  ensureExpectation(200, responseFarm1)
  jest.advanceTimersByTime(3600 * 1000 * 3)
  const responseStop1 = await promiseHandler(
    stopFarmController.handle({ payload: { accountName: s.me.accountName, userId: s.me.userId } })
  )
  ensureExpectation(200, responseStop1)

  const mePlan = (await i.planRepository.getById(diamondPlan.id_plan)) as PlanUsage
  const usages = mePlan?.usages.data
  expect(usages).toHaveLength(1)
  expect(usages[0].accountName).toBe(s.me.accountName)
  expect(usages[0].amountTime).toBe(3600 * 3)
})

describe("no users on steam database", () => {
  beforeEach(async () => {
    await setupInstances({
      validSteamAccounts: [],
    })
  })

  test("should reject when account that don't exists on steam database is somehow", async () => {
    const response = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          userId: s.me.userId,
          accountName: s.me.accountName,
          gamesID: [10892],
        },
      })
    )

    expect(response).toStrictEqual({
      status: 404,
      json: {
        message: "Steam Account não existe no banco de dados da Steam, delete essa conta e crie novamente.",
        eresult: 18,
      },
    })
  })
})

function createLogPersistFarmSessionHandler(): Observer {
  return {
    operation: "user-complete-farm-session",
    async notify({ pauseFarmCategory }: UserCompleteFarmSessionCommand) {
      if (pauseFarmCategory.type === "STOP-ALL") {
        pauseFarmCategory.usages.forEach(({ accountName, amountTime }) => {
          console.log(`[BROKER]: [${accountName}] farmou durante ${amountTime} segundos.`)
        })
      } else if (pauseFarmCategory.type === "STOP-ONE") {
        const { accountName, amountTime } = pauseFarmCategory.usage
        console.log(`[BROKER]: [${accountName}] farmou durante ${amountTime} segundos.`)
      } else if (pauseFarmCategory.type === "STOP-SILENTLY") {
      }
    },
  } as Observer
}
