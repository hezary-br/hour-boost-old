import SteamUser from "steam-user"
import { EventEmitter } from "~/application/services"
import { SteamAccountClient } from "~/application/services/steam"
import { Publisher } from "~/infra/queue"
import { SteamUserMock } from "~/infra/services/SteamUserMock"

import { makeSACFactoryOptional } from "~/__tests__/factories"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
const friendInstances = {} as PrefixKeys<"friend">
let logSpy: jest.SpyInstance
const makeSAC = makeSACFactoryOptional(validSteamAccounts, i.publisher)

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  logSpy = import.meta.jest.spyOn(console, "log")
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

afterEach(async () => {
  import.meta.jest.useRealTimers()
  await i.sacStateCacheRepository.flushAll()
})

test("should ", async () => {
  const sacEmitter = new EventEmitter()
  const sac = new SteamAccountClient({
    instances: {
      publisher: new Publisher(),
      emitter: sacEmitter,
    },
    props: {
      client: new SteamUserMock([]) as unknown as SteamUser,
      userId: "",
      username: "vitor",
      accountName: "account",
      planId: "",
      autoRestart: false,
      isRequiringSteamGuard: false,
    },
  })
  sac.farmGames([322, 123])
  expect(sac.getGamesPlaying()).toStrictEqual([322, 123])
})

test("should await promise, call hasSession resolver once user logged in", async () => {
  import.meta.jest.useFakeTimers({ doNotFake: ["setTimeout"] })
  const sac = meInstances.meSAC
  let xs = 0

  const seconds = 2

  sac.emitter.on("hasSession", async () => {
    await new Promise(res => setTimeout(res, seconds * 100 - 100))
    console.log(`Resolved after ${seconds - 1} seconds`)
  })

  sac.emitter.on("hasSession", async () => {
    await new Promise(res => setTimeout(res, seconds * 100))
    console.log(`Resolved after ${seconds} seconds`)
  })
  sac.login(s.me.accountName, password)
  console.log("Waiting...")
  await new Promise(res => {
    sac.emitter.setEventResolver("hasSession", () => {
      res((xs = 1))
    })
  })
  // import.meta.jest.runAllTimers()
  expect(xs).toBe(1)
})

test("should await promise, call interrupt resolver once connection is break", async () => {
  console.log("starting last one")
  import.meta.jest.useFakeTimers({ doNotFake: ["setImmediate", "setTimeout"] })
  const sac = meInstances.meSAC
  const userCluster = i.usersClusterStorage.getOrAdd(s.me.username, meInstances.me.plan)
  let xs = 0
  userCluster.addSAC(sac)

  sac.login(s.me.accountName, password)
  import.meta.jest.advanceTimersByTime(0)
  sac.client.emit("error", { eresult: SteamUser.EResult.NoConnection })
  await new Promise(res => {
    sac.emitter.setEventResolver("interrupt", () => {
      xs = 1
      res(true)
    })
  })
  await new Promise(res => {
    setTimeout(res, 200)
  })
  expect(xs).toBe(1)
})

describe("requiring steam guard", () => {
  beforeEach(() => {
    // talvez makeSAC precise ser dinâmico no beforeEach
    meInstances.meSAC = makeSAC(meInstances.me, s.me.accountName, {
      isRequiringSteamGuard: true,
    })
  })

  test("should not be able to farm", async () => {
    expect(meInstances.meSAC.isRequiringSteamGuard).toBe(true)
    const [error] = meInstances.meSAC.farmGames([500])
    expect(error?.code).toBe("SAC-IS-REQUIRING-STEAM-GUARD")

    meInstances.meSAC.client.emit("loggedOn")
    expect(meInstances.meSAC.isRequiringSteamGuard).toBe(false)
  })

  test("should not be able to set his status", async () => {
    expect(meInstances.meSAC.isRequiringSteamGuard).toBe(true)
    const [error] = meInstances.meSAC.setStatus("offline")
    expect(error?.code).toBe("SAC-IS-REQUIRING-STEAM-GUARD")
  })

  test("should not be able to get account games", async () => {
    expect(meInstances.meSAC.isRequiringSteamGuard).toBe(true)
    const [error] = await meInstances.meSAC.getAccountGamesList()
    expect(error?.code).toBe("SAC-IS-REQUIRING-STEAM-GUARD")
  })

  test("should not be able to get account games", async () => {
    expect(meInstances.meSAC.isRequiringSteamGuard).toBe(true)
    const [error] = await meInstances.meSAC.getAccountPersona()
    expect(error?.code).toBe("SAC-IS-REQUIRING-STEAM-GUARD")
  })
})
