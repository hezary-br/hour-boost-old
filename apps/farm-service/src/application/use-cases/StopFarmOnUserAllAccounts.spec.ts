import { AddSteamAccount } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"
import { AddSteamAccountController } from "~/presentation/controllers"
import { PlanBuilder } from "../factories/PlanFactory"
import { AddSteamAccountUseCase } from "./AddSteamAccountUseCase"
import { CheckSteamAccountOwnerStatusUseCase } from "./CheckSteamAccountOwnerStatusUseCase"
import { StopFarmOnUserAllAccounts } from "./StopFarmOnUserAllAccounts"
import { StopFarmUseCase } from "./StopFarmUseCase"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let stopFarmOnUserAllAccounts: StopFarmOnUserAllAccounts
let stopFarmUseCase: StopFarmUseCase
let addSteamAccountController: AddSteamAccountController

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me")
  const addSteamAccount = new AddSteamAccount(i.usersRepository, i.idGenerator)
  stopFarmOnUserAllAccounts = new StopFarmOnUserAllAccounts(i.stopFarmUseCase)
  const checkSteamAccountOwnerStatusUseCase = new CheckSteamAccountOwnerStatusUseCase(
    i.steamAccountsRepository
  )
  const addSteamAccountUseCase = new AddSteamAccountUseCase(
    addSteamAccount,
    i.allUsersClientsStorage,
    i.usersDAO,
    checkSteamAccountOwnerStatusUseCase,
    i.hashService
  )
  addSteamAccountController = new AddSteamAccountController(addSteamAccountUseCase)
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })

  const diamond = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(diamond)

  await addSteamAccountController.handle({
    payload: {
      accountName: s.me.accountName2,
      password,
      userId: s.me.userId,
    },
  })

  await i.farmGamesController.handle({
    payload: {
      accountName: s.me.accountName,
      gamesID: [308],
      userId: s.me.userId,
    },
  })

  await i.farmGamesController.handle({
    payload: {
      accountName: s.me.accountName2,
      gamesID: [700],
      userId: s.me.userId,
    },
  })
})

test("should stop farm on user all accounts", async () => {
  const farmingUsers = i.usersClusterStorage.getAccountsStatus()
  expect(farmingUsers).toStrictEqual({
    [s.me.username]: {
      [s.me.accountName]: "FARMING",
      [s.me.accountName2]: "FARMING",
    },
  })

  const user = await i.usersRepository.getByID(s.me.userId)
  await stopFarmOnUserAllAccounts.execute(user!, console.log)

  const farmingUsers2 = i.usersClusterStorage.getAccountsStatus()
  expect(farmingUsers2).toStrictEqual({
    [s.me.username]: {},
  })
})
