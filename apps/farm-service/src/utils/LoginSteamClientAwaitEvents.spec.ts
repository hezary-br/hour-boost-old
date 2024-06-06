import { LoginSteamWithCredentials } from "~/utils/LoginSteamWithCredentials"

import {
  type CustomInstances,
  type MakeTestInstancesProps,
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
let meInstances = {}

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

test("should login on steam account", async () => {
  const loginSteamClientAwaitEvents = new LoginSteamWithCredentials()
  const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
  const [errorLoggin, result] = await loginSteamClientAwaitEvents.execute({
    accountName: s.me.accountName,
    password,
    sac,
    trackEvents: {
      loggedOn: true,
      steamGuard: true,
      timeout: true,
      error: true,
    },
    timeoutInSeconds: 1,
  })
  expect(errorLoggin).toBeNull()
  expect(result).toBeTruthy()
})

test("should login on steam account", async () => {
  const loginSteamClientAwaitEvents = new LoginSteamWithCredentials()
  const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
  const [errorLoggin, result] = await loginSteamClientAwaitEvents.execute({
    accountName: "NOT_EXISTING_ACCOUNT_NAME",
    password,
    sac,
    trackEvents: {
      loggedOn: true,
      steamGuard: true,
      timeout: true,
      error: true,
    },
    timeoutInSeconds: 1,
  })
  expect(errorLoggin).toBeTruthy()
  expect(result).toBeUndefined()
  expect(errorLoggin?.code).toBe("WAS_NOT_ABLE_TO_CONNECT_TO_STEAM")
})
