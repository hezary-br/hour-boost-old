import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
} from "~/__tests__/instances"
import type { SteamUserMock } from "~/infra/services"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { promiseHandler } from "~/presentation/controllers"
import { sleep } from "~/utils"
import { SteamUserMockBuilder } from "~/utils/builders"

const validSteamAccounts = [{ accountName: "paco", password }]

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
  await setupInstances(
    { validSteamAccounts },
    { steamUserBuilder: new SteamUserMockBuilder(validSteamAccounts, true) }
  )
})

test("should ask for the steam guard code", async () => {
  const response = await promiseHandler(
    i.farmGamesController.handle({
      payload: {
        userId: s.me.userId,
        accountName: s.me.accountName,
        gamesID: [10892],
      },
    })
  )

  expect(response.status).toBe(403)

  const sac1 = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
  expect(sac1.getLastArguments("steamGuard")).toHaveLength(3)
  expect((sac1.client as unknown as SteamUserMock).steamGuardCode).toBeUndefined()

  expect(response).toStrictEqual({
    status: 403,
    json: { message: "Steam Guard requerido. Enviando para seu celular." },
  })

  // should call function that sets the steam guard code to the client instance
  const userClients2 = i.allUsersClientsStorage.getOrThrow(s.me.userId)
  const sac2 = userClients2.getAccountClientOrThrow(s.me.accountName)

  expect((sac2.client as unknown as SteamUserMock).steamGuardCode).toBeUndefined()
  const steamGuardLastArguments = sac2.getLastArguments("steamGuard")
  if (!steamGuardLastArguments) throw new Error("No steam guard last arguments.")
  const [_, setCode] = steamGuardLastArguments
  setCode("998776")
  await sleep(0.1)
  expect((sac2.client as unknown as SteamUserMock).steamGuardCode).toBe("998776")

  // NOW should not ask for the steamGuard, even being on mobile, since last action saved the steam guard
  const response2 = await promiseHandler(
    i.farmGamesController.handle({
      payload: {
        userId: s.me.userId,
        accountName: s.me.accountName,
        gamesID: [10892],
      },
    })
  )
  const userSteamClients = i.allUsersClientsStorage.getOrThrow(s.me.userId)
  const sac = userSteamClients.getAccountClientOrThrow(s.me.accountName)
  expect((sac.client as unknown as SteamUserMock).isMobile()).toBeTruthy()

  expect(response2).toStrictEqual({
    status: 200,
    json: { message: "Iniciando farm." },
  })
})
