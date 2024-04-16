import { jest } from "@jest/globals"
import { CacheState, type CacheStateDTO } from "core"
import SteamUser from "steam-user"
import { connection } from "~/__tests__/connection"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  validSteamAccounts,
} from "~/__tests__/instances"
import { PlanBuilder } from "~/application/factories/PlanFactory"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

const log = console.log
console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
}

beforeEach(async () => {
  jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick", "setTimeout"] })
  await setupInstances({
    validSteamAccounts,
  })
  await i.sacStateCacheRepository.flushAll()
})

afterAll(() => {
  jest.useRealTimers()
})

test("should NOT store persist farm session if NoConnection error is triggered AND account don't have autorelogin on", async () => {
  console.log = log
  const user = await i.usersRepository.getByID(s.me.userId)
  if (!user) throw user
  i.allUsersClientsStorage.addSteamAccount(s.me.username, s.me.userId, meInstances.meSAC)
  i.sacCacheInMemory.state.set(
    s.me.accountName,
    CacheState.create({
      accountName: s.me.accountName,
      planId: user.plan.id_plan,
      username: s.me.username,
      status: "online",
    })
  )
  const [error, meCluster] = i.usersClusterStorage.get(s.me.username)
  if (error) throw error
  const [errorAddingSAC] = meCluster.addSAC(meInstances.meSAC)
  if (errorAddingSAC) throw errorAddingSAC
  const [errorFarmingWithAccount] = await meCluster.farmWithAccount({
    accountName: s.me.accountName,
    gamesId: [100],
    planId: meInstances.me.plan.id_plan,
    session: {
      type: "NEW",
    },
  })
  if (errorFarmingWithAccount) throw errorFarmingWithAccount
  // await new Promise(res => meInstances.meSAC.emitter.setEventResolver("hasSession", res))
  jest.advanceTimersByTime(1000 * 3600 * 2) // 2 hours
  connection.emit("break")

  const stateCacheDTO = await i.sacStateCacheRepository.get(s.me.accountName)
  expect(stateCacheDTO).not.toBeNull()
  expect(stateCacheDTO!.gamesPlaying).toStrictEqual([])
  expect(stateCacheDTO!.isFarming()).toStrictEqual(false)
  expect(stateCacheDTO!.farmStartedAt).toStrictEqual(null)
})

test("should stop farming once interrupt occurs", async () => {
  jest
    .useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
    .setSystemTime(new Date("2024-06-10T10:00:00"))

  const meCluster = i.userClusterBuilder.create(s.me.username, meInstances.me.plan)
  let xs = 0
  const sac = meInstances.meSAC
  sac.emitter.setEventResolver("interrupt", () => {
    // res(true)
  })
  meCluster.addSAC(sac)
  const pauseFarmOnAccountSPY = jest.spyOn(meCluster, "pauseFarmOnAccount")
  const sacClientSPY = jest.spyOn(sac.client, "emit")
  const sacEmitterSPY = jest.spyOn(sac.emitter, "emit")

  await meCluster.farmWithAccount({
    accountName: s.me.accountName,
    gamesId: [100],
    planId: meInstances.me.plan.id_plan,
    session: {
      type: "NEW",
    },
  })
  jest.advanceTimersByTime(0)
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
  connection.emit("break")
  // await new Promise(setImmediate)
  await new Promise(res => {
    sac.emitter.setEventResolver("interrupt", () => {
      xs = 1
      res(true)
    })
  })
  expect(xs).toBe(1)

  const sacClientCalls = sacClientSPY.mock.calls
  expect(sacClientCalls[0]).toStrictEqual(["error", { eresult: SteamUser.EResult.NoConnection }])

  const sacEmitterCalls = sacEmitterSPY.mock.calls
  const sacState: CacheStateDTO = {
    farmStartedAt: new Date("2024-06-10T10:00:00").getTime(),
    isFarming: true,
    accountName: "paco",
    gamesPlaying: [100],
    gamesStaging: [],
    planId: meInstances.me.plan.id_plan,
    username: s.me.username,
    status: "online",
  }
  expect(sacEmitterCalls[0]).toStrictEqual([
    "interrupt",
    sacState,
    { eresult: SteamUser.EResult.NoConnection },
  ])

  expect(pauseFarmOnAccountSPY).toHaveBeenCalledTimes(1) // 1
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "IDDLE",
  })
  console.log = () => {}
})

// não estou mais fazendo assim, agr relog é controlado
test.skip("should get back farming once has session again", async () => {
  const meCluster = i.usersClusterStorage.getOrAdd(s.me.username, meInstances.me.plan)
  const sac = meInstances.meSAC
  const spySACEmitter = jest.spyOn(sac.emitter, "emit")
  meCluster.addSAC(sac)
  await meCluster.farmWithAccount({
    accountName: s.me.accountName,
    gamesId: [100],
    planId: meInstances.me.plan.id_plan,
    session: {
      type: "NEW",
    },
  })
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
  jest.advanceTimersByTime(1000 * 3600 * 2) // 2 hours
  connection.emit("break")
  await new Promise(res => {
    sac.emitter.setEventResolver("interrupt", () => {
      res(true)
    })
  })
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "IDDLE",
  })
  jest.advanceTimersByTime(600)
  await new Promise(res => {
    sac.emitter.setEventResolver("relog-with-state", () => {
      res(true)
    })
  })
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
})

test("should check if account is farming properly", async () => {
  const plan = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(plan)
  jest.useFakeTimers({ doNotFake: ["setTimeout"] }).setSystemTime(new Date("2024-01-10T10:00:00.000Z"))
  const meCluster = i.usersClusterStorage.getOrAdd(s.me.username, meInstances.me.plan)
  const sac = meInstances.meSAC
  meCluster.addSAC(sac)
  const [error] = await meCluster.farmWithAccount({
    accountName: s.me.accountName,
    gamesId: [100],
    planId: plan.id_plan,
    session: {
      type: "NEW",
    },
  })
  expect(error).toBeNull()
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
  expect(meCluster.farmService.hasAccountsFarming()).toBe(true)
  expect(meCluster.farmService.startedAt).toStrictEqual(new Date("2024-01-10T10:00:00.000Z"))
  expect(meCluster.isAccountFarmingOnService(s.me.accountName)).toBe(true)
  jest.advanceTimersByTime(1000 * 3600 * 2)

  /**
   * pause
   */
  const [errorPausing, usages] = meCluster.pauseFarmOnAccountSync({
    accountName: s.me.accountName,
    isFinalizingSession: true,
  })
  expect(errorPausing).toBeNull()
  expect(meCluster.getAccountsStatus()).toStrictEqual({})
  expect(meCluster.farmService.hasAccountsFarming()).toBe(false)
  expect(usages?.type).toBe("STOP-ONE")
  expect(meCluster.isAccountFarmingOnService(s.me.accountName)).toBe(false)

  /**
   * farm again
   */
  const [error2] = await meCluster.farmWithAccount({
    accountName: s.me.accountName,
    gamesId: [100],
    planId: plan.id_plan,
    session: {
      type: "NEW",
    },
  })
  expect(error2).toBeNull()
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
  expect(meCluster.farmService.hasAccountsFarming()).toBe(true)
  expect(meCluster.farmService.startedAt).toStrictEqual(new Date("2024-01-10T12:00:00.000Z"))
  expect(meCluster.isAccountFarmingOnService(s.me.accountName)).toBe(true)
})

// não estou mais fazendo assim, agr relog é controlado
test.skip("should start farm again when relog with state happens", async () => {
  i = makeTestInstances({ validSteamAccounts })
  meInstances = await i.createUser("me")
  jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick", "setTimeout"] })

  console.log = log
  i.allUsersClientsStorage.flushAllAccounts()
  jest.setSystemTime(new Date("2024-01-10T10:00:00.000Z"))
  const meCluster = i.usersClusterStorage.getOrAdd(s.me.username, meInstances.me.plan)
  const sac = meInstances.meSAC
  meCluster.addSAC(sac)
  const pauseFarmOnAccountSPY = jest.spyOn(meCluster, "pauseFarmOnAccount")
  const sacClientSPY = jest.spyOn(sac.client, "emit")
  const sacEmitterSPY = jest.spyOn(sac.emitter, "emit")

  await meCluster.farmWithAccount({
    accountName: s.me.accountName,
    gamesId: [100],
    planId: meInstances.me.plan.id_plan,
    session: {
      type: "NEW",
    },
  })
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
  jest.advanceTimersByTime(1000 * 3600 * 2) // 2 hours
  connection.emit("break")
  jest.advanceTimersByTime(500) // 500ms para relogar
  await new Promise(res => sac.emitter.setEventResolver("relog-with-state", res))

  const sacClientCalls = sacClientSPY.mock.calls
  expect(sacClientCalls[0]).toStrictEqual(["error", { eresult: SteamUser.EResult.NoConnection }])
  expect(sacClientCalls[1]).toStrictEqual(["webSession"])

  const sacEmitterCalls = sacEmitterSPY.mock.calls
  const sacState: CacheStateDTO = {
    accountName: "paco",
    gamesPlaying: [100],
    gamesStaging: [],
    planId: meInstances.me.plan.id_plan,
    username: s.me.username,
    status: "offline",
    farmStartedAt: new Date("2024-01-10T10:00:00.000Z").getTime(),
    isFarming: true,
  }
  console.log = log
  console.log({ sacEmitterCalls })
  console.log = () => {}
  expect(sacEmitterCalls[0]).toStrictEqual([
    "interrupt",
    sacState,
    { eresult: SteamUser.EResult.NoConnection },
  ]) // null porque primeira vez sendo pausado
  expect(sacEmitterCalls[1]).toStrictEqual(["hasSession"])
  expect(sacEmitterCalls[2]).toStrictEqual([
    "relog-with-state",
    {
      ...sacState,
      isFarming: true,
      farmStartedAt: new Date("2024-01-10T10:00:00.000Z").getTime(),
    } satisfies CacheStateDTO,
  ]) // agora ja possui valor quando foi parado
  expect(pauseFarmOnAccountSPY).toHaveBeenCalledTimes(1) // 1
  expect(meCluster.getAccountsStatus()).toStrictEqual({
    [s.me.accountName]: "FARMING",
  })
})
