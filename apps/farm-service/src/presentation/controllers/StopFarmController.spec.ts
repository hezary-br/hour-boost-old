import {
  makeTestInstances,
  password,
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
} from "~/__tests__/instances"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { StopFarmController } from "~/presentation/controllers"
import { promiseHandler } from "~/presentation/controllers/promiseHandler"
import { SteamUserMockBuilder } from "~/utils/builders"

const log = console.log
console.log = () => {}

const validSteamAccounts = [{ accountName: "paco", password }]
let stopFarmController: StopFarmController

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  stopFarmController = new StopFarmController(i.stopFarmUseCase, i.usersRepository)
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

afterEach(() => {
  i.publisher.observers = []
})

describe("StopFarmController.spec test suite", () => {
  describe("Account Name IS NOT farming", () => {
    test("should reject is not registered user is provided", async () => {
      const stopFarmController = new StopFarmController(i.stopFarmUseCase, i.usersRepository)
      const { status, json } = await stopFarmController.handle({
        payload: {
          userId: "RANDOM_ID",
          accountName: s.me.accountName,
        },
      })

      expect(json).toMatchObject({
        message: "Usuário não encontrado.",
      })
      expect(status).toBe(404)
      expect(Object.keys(i.usersClusterStorage.getAccountsStatus())).toStrictEqual(["user_vrsl"])
    })

    test("should reject if user is not farming", async () => {
      const stopFarmController = new StopFarmController(i.stopFarmUseCase, i.usersRepository)
      const { status, json } = await promiseHandler(
        stopFarmController.handle({
          payload: {
            userId: s.me.userId,
            accountName: s.me.accountName,
          },
        })
      )

      expect(json).toMatchObject({
        message: "Usuário não possui contas farmando.",
      })
      expect(status).toBe(403)
      expect(Object.keys(i.usersClusterStorage.getAccountsStatus())).toStrictEqual(["user_vrsl"])
    })
  })

  describe("Account Name IS farming", () => {
    beforeEach(async () => {
      await setupInstances(
        { validSteamAccounts },
        { steamUserBuilder: new SteamUserMockBuilder(validSteamAccounts) }
      )

      const { status } = await promiseHandler(
        i.farmGamesController.handle({
          payload: {
            accountName: s.me.accountName,
            gamesID: [99],
            userId: s.me.userId,
          },
        })
      )
      expect(status).toBe(200)
    })

    test("should delete farming user from storage after stop farm", async () => {
      const { status, json } = await promiseHandler(
        stopFarmController.handle({
          payload: {
            userId: s.me.userId,
            accountName: s.me.accountName,
          },
        })
      )

      console.log({ status, json })

      expect(json.message).toBe("Farm pausado com sucesso.")
      expect(json.code).toBe("SUCCESS")
      expect(status).toBe(200)
      expect(i.usersClusterStorage.getAccountsStatus()).toStrictEqual({
        [s.me.username]: {
          [s.me.accountName]: "IDDLE",
        },
      })
    })
  })
})
