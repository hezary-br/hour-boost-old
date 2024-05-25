import { CacheState, type CacheStateDTO } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  validSteamAccounts,
} from "~/__tests__/instances"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
  await i.sacStateCacheRepository.flushAll()
})

test("should write a ME cache and retrieves it", async () => {
  // console.log = log
  await expect(
    i.sacStateCacheRepository.save(
      CacheState.restore({
        accountName: "markis",
        gamesPlaying: [],
        gamesStaging: [],
        planId: meInstances.me.plan.id_plan,
        username: s.me.username,
        farmStartedAt: null,
        status: "online",
      })
    )
  ).resolves.not.toThrow()
  const cache = await i.sacStateCacheRepository.get("markis")
  console.log({ cache })
  expect(cache?.toDTO()).toStrictEqual({
    accountName: "markis",
    gamesPlaying: [],
    gamesStaging: [],
    isFarming: false,
    farmStartedAt: null,
    planId: meInstances.me.plan.id_plan,
    username: s.me.username,
    status: "online",
  } as CacheStateDTO)
})

test("should init state cache", async () => {
  await i.sacStateCacheRepository.flushAll()
  i.sacCacheInMemory.state.set(
    s.me.accountName,
    CacheState.create({
      accountName: s.me.accountName,
      planId: meInstances.me.plan.id_plan,
      username: s.me.username,
      status: "online",
    })
  )
  const state = await i.sacStateCacheRepository.get(s.me.accountName)
  expect(state?.accountName).toBe(s.me.accountName)
  expect(state?.gamesPlaying).toStrictEqual([])
  expect(state?.isFarming()).toBeFalsy()
})
