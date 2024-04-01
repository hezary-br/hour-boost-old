import { AddSteamAccount } from "core"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  type PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { PlanBuilder } from "~/application/factories/PlanFactory"
import { CheckSteamAccountOwnerStatusUseCase } from "~/application/use-cases/"
import { AddSteamAccountUseCase } from "~/application/use-cases/AddSteamAccountUseCase"
import { ToggleAutoReloginUseCase } from "~/application/use-cases/ToggleAutoReloginUseCase"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

const log = console.log
console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let addSteamAccount: AddSteamAccount
let addSteamAccountUseCase: AddSteamAccountUseCase
let checkSteamAccountOwnerStatusUseCase: CheckSteamAccountOwnerStatusUseCase

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me", { persistSteamAccounts: false })
  const accountId = meInstances.me.steamAccounts.data[0].id_steamAccount
  meInstances.me.steamAccounts.remove(accountId)
  checkSteamAccountOwnerStatusUseCase = new CheckSteamAccountOwnerStatusUseCase(i.steamAccountsRepository)
  addSteamAccount = new AddSteamAccount(i.usersRepository, i.idGenerator)
  addSteamAccountUseCase = new AddSteamAccountUseCase(
    addSteamAccount,
    i.allUsersClientsStorage,
    i.usersDAO,
    checkSteamAccountOwnerStatusUseCase,
    i.hashService
  )
  i.steamAccountsMemory.disownSteamAccountsAll()
  i.usersMemory.dropAllSteamAccounts()
}

beforeEach(async () => {
  await setupInstances({
    validSteamAccounts,
  })
})

test("should remove steam account", async () => {
  await addSteamAccount.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
    password,
  })
  const account1 = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
  expect(account1?.ownerId).toBe(s.me.userId)

  const [error] = await i.removeSteamAccountUseCase.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
  })
  if (error) throw error
  const account2 = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
  expect(account2?.credentials.accountName).toBe("paco")
  expect(account2?.ownerId).toBe(null)
})

test("should remove steam account and set auto restarter as false", async () => {
  const plan = new PlanBuilder(s.me.userId).infinity().diamond()
  await i.changeUserPlan(plan)
  await addSteamAccount.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
    password,
  })
  const account1 = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
  expect(account1?.ownerId).toBe(s.me.userId)

  expect((await i.steamAccountsRepository.getByAccountName(s.me.accountName))?.autoRelogin).toBe(false)
  const toggleAutoReloginUseCase = new ToggleAutoReloginUseCase(
    i.allUsersClientsStorage,
    i.planRepository,
    i.steamAccountsRepository,
    i.usersDAO
  )
  const [errorTogglingRelogin] = await toggleAutoReloginUseCase.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
  })
  expect(errorTogglingRelogin).toBeNull()
  expect((await i.steamAccountsRepository.getByAccountName(s.me.accountName))?.autoRelogin).toBe(true)

  const [error] = await i.removeSteamAccountUseCase.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
  })
  if (error) throw error
  const account2 = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
  expect(account2?.credentials.accountName).toBe("paco")
  expect(account2?.ownerId).toBe(null)
  expect((await i.steamAccountsRepository.getByAccountName(s.me.accountName))?.autoRelogin).toBe(false)
})

test("should remove steam account and logoff client", async () => {
  await addSteamAccount.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
    password,
  })
  const sac = i.allUsersClientsStorage.getAccountClient(s.me.userId, s.me.accountName)!
  const spy = import.meta.jest.spyOn(sac.client, "logOff")
  const account1 = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
  expect(account1?.ownerId).toBe(s.me.userId)
  expect(spy).toHaveBeenCalledTimes(0)

  const [error] = await i.removeSteamAccountUseCase.execute({
    accountName: s.me.accountName,
    userId: s.me.userId,
  })
  if (error) throw error
  const account2 = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
  expect(account2?.credentials.accountName).toBe("paco")
  expect(account2?.ownerId).toBe(null)
  expect(spy).toHaveBeenCalledTimes(1)
})
