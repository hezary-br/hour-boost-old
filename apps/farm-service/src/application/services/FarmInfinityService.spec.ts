import {
  type CustomInstances,
  type MakeTestInstancesProps,
  makeTestInstances,
  validSteamAccounts,
} from "~/__tests__/instances"
import { PlanBuilder } from "~/application/factories/PlanFactory"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { StopFarmController, promiseHandler } from "~/presentation/controllers"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

test("should ", async () => {
  const today = new Date("2024-01-12T10:00:00.000Z")
  import.meta.jest.useFakeTimers({ doNotFake: ["setTimeout"] }).setSystemTime(today)
  await i.createUser("me")

  const plan = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(plan)

  const { status, json } = await promiseHandler(
    i.farmGamesController.handle({
      payload: {
        accountName: s.me.accountName,
        gamesID: [100],
        userId: s.me.userId,
      },
    })
  )
  expect(status).toBeLessThan(300)
  const cacheState = await i.sacStateCacheRepository.get(s.me.accountName)
  expect(cacheState?.farmStartedAt?.getTime()).toBe(today.getTime())

  /**
   * Stop farm
   */
  const stopFarmController = new StopFarmController(i.stopFarmUseCase, i.usersRepository)

  await promiseHandler(
    stopFarmController.handle({
      payload: {
        accountName: s.me.accountName,
        userId: s.me.userId,
      },
    })
  )

  const cacheState2 = await i.sacStateCacheRepository.get(s.me.accountName)
  expect(cacheState2?.farmStartedAt).toBe(null)

  import.meta.jest.advanceTimersByTime(1000 * 3600 * 2) // 2 hours
  const after = new Date("2024-01-12T12:00:00.000Z")

  // console.log = log

  /**
   * Farm again
   */

  const res = await promiseHandler(
    i.farmGamesController.handle({
      payload: {
        accountName: s.me.accountName,
        gamesID: [100],
        userId: s.me.userId,
      },
    })
  )
  expect(res.status).toBeLessThan(300)
  const cacheState3 = await i.sacStateCacheRepository.get(s.me.accountName)
  expect(cacheState3?.farmStartedAt?.getTime()).toBe(after.getTime())
})
