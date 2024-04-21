import { AddSteamAccount } from "core"
import { connection } from "~/__tests__/connection"
import {
  type CustomInstances,
  type MakeTestInstancesProps,
  PrefixKeys,
  makeTestInstances,
  password,
  validSteamAccounts,
} from "~/__tests__/instances"
import { AddSteamAccountUseCase } from "~/application/use-cases/AddSteamAccountUseCase"
import { RestoreAccountConnectionUseCase } from "~/application/use-cases/RestoreAccountConnectionUseCase"

import { testUsers as s, setPlayingSession } from "~/infra/services/UserAuthenticationInMemory"
import { AddSteamAccountController, promiseHandler } from "~/presentation/controllers"
import { SteamUserMockBuilder } from "~/utils/builders"

const log = console.log
// console.log = () => {}

let i = makeTestInstances({
  validSteamAccounts,
})
let meInstances = {} as PrefixKeys<"me">
let restoreAccountConnectionUseCase: RestoreAccountConnectionUseCase
let addSteamAccountController: AddSteamAccountController

async function setupInstances(props?: MakeTestInstancesProps, customInstances?: CustomInstances) {
  i = makeTestInstances(props, customInstances)
  meInstances = await i.createUser("me", { persistSteamAccounts: false })
  const addSteamAccount = new AddSteamAccount(i.usersRepository, i.idGenerator)
  const addSteamAccountUseCase = new AddSteamAccountUseCase(
    addSteamAccount,
    i.allUsersClientsStorage,
    i.usersDAO,
    i.checkSteamAccountOwnerStatusUseCase,
    i.hashService
  )

  addSteamAccountController = new AddSteamAccountController(addSteamAccountUseCase)
  restoreAccountConnectionUseCase = new RestoreAccountConnectionUseCase(
    i.allUsersClientsStorage,
    i.usersClusterStorage,
    i.sacStateCacheRepository,
    i.hashService
  )
  meInstances.me.steamAccounts.deleteAll()
}

describe("NOT MOBILE test suite", () => {
  beforeEach(async () => {
    await setupInstances({
      validSteamAccounts,
    })
  })

  test("should NOT restore session if account is already logged", async () => {
    console.log = log
    const { status } = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: s.me.accountName,
          password,
          userId: s.me.userId,
        },
      })
    )

    const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
    expect(sac.logged).toBe(true)

    const steamAccount = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
    if (!steamAccount?.ownerId) throw "account not owned"
    const user = await i.usersRepository.getByID(steamAccount.ownerId)
    if (!user?.plan.id_plan) throw "user 404"
    const plan = await i.planRepository.getById(user?.plan.id_plan)
    if (!plan) throw "plan 404"

    const [errorRestoringSession, result] = await restoreAccountConnectionUseCase.execute({
      steamAccount: {
        accountName: steamAccount.credentials.accountName,
        password: steamAccount.credentials.password,
        autoRestart: steamAccount.autoRelogin,
        isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
      },
      user: {
        id: user.id_user,
        plan: user.plan,
        username: user.username,
      },
    })
    expect(errorRestoringSession).toBeNull()
    if (errorRestoringSession) return
    expect(result.code).toBe("ACCOUNT-IS-LOGGED-ALREADY")
    // expect(result.).toBeTruthy()
  })

  test("should restore session successfully", async () => {
    console.log = log
    const { status } = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: s.me.accountName,
          password,
          userId: s.me.userId,
        },
      })
    )
    expect(status).toBe(201)
  })

  test("should restore session with state successfully", async () => {
    const res_addSteamAccount = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: s.me.accountName,
          password,
          userId: s.me.userId,
        },
      })
    )
    expect(res_addSteamAccount.status).toBe(201)

    const res_farmGamesOnAccount = await promiseHandler(
      i.farmGamesController.handle({
        payload: {
          accountName: s.me.accountName,
          gamesID: [707],
          userId: s.me.userId,
        },
      })
    )
    expect(res_farmGamesOnAccount.status).toBe(200)

    const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
    expect(sac.logged).toBe(true)

    connection.emit("break")

    const steamAccount = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
    if (!steamAccount?.ownerId) throw "account not owned"
    const user = await i.usersRepository.getByID(steamAccount.ownerId)
    if (!user?.plan.id_plan) throw "user 404"
    const plan = await i.planRepository.getById(user?.plan.id_plan)
    if (!plan) throw "plan 404"

    const [errorRestoringSession, result] = await restoreAccountConnectionUseCase.execute({
      steamAccount: {
        accountName: steamAccount.credentials.accountName,
        password: steamAccount.credentials.password,
        autoRestart: steamAccount.autoRelogin,
        isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
      },
      user: {
        id: user.id_user,
        plan: user.plan,
        username: user.username,
      },
    })
    expect(errorRestoringSession).toBeNull()
    if (errorRestoringSession) return
    expect(result.code).toBe("ACCOUNT-RELOGGED::TOKEN")
    // expect(result.fatal).toBeTruthy()
  })

  test("should not stop cron when other session is playing", async () => {
    const { status } = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: s.me.accountName,
          password,
          userId: s.me.userId,
        },
      })
    )
    expect(status).toBe(201)

    const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
    expect(sac.logged).toBe(true)

    connection.emit("break", { relog: false })
    setPlayingSession([s.me.accountName])

    const steamAccount = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
    if (!steamAccount?.ownerId) throw "account not owned"
    const user = await i.usersRepository.getByID(steamAccount.ownerId)
    if (!user?.plan.id_plan) throw "user 404"
    const plan = await i.planRepository.getById(user?.plan.id_plan)
    if (!plan) throw "plan 404"

    const [errorRestoringSession, result] = await restoreAccountConnectionUseCase.execute({
      steamAccount: {
        accountName: steamAccount.credentials.accountName,
        password: steamAccount.credentials.password,
        autoRestart: steamAccount.autoRelogin,
        isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
      },
      user: {
        id: user.id_user,
        plan: user.plan,
        username: user.username,
      },
    })
    setPlayingSession([])
    if (!errorRestoringSession) return
    expect(errorRestoringSession.code).toBe("OTHER-SESSION-STILL-ON")
  })

  test("should not stop cron when other session is playing", async () => {
    const { status } = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: s.me.accountName,
          password,
          userId: s.me.userId,
        },
      })
    )
    expect(status).toBe(201)

    const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
    expect(sac.logged).toBe(true)

    connection.emit("break", { relog: false })
    setPlayingSession([s.me.accountName])

    const steamAccount = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
    if (!steamAccount?.ownerId) throw "account not owned"
    const user = await i.usersRepository.getByID(steamAccount.ownerId)
    if (!user?.plan.id_plan) throw "user 404"
    const plan = await i.planRepository.getById(user?.plan.id_plan)
    if (!plan) throw "plan 404"

    const [errorRestoringSession, result] = await restoreAccountConnectionUseCase.execute({
      steamAccount: {
        accountName: steamAccount.credentials.accountName,
        password: steamAccount.credentials.password,
        autoRestart: steamAccount.autoRelogin,
        isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
      },
      user: {
        id: user.id_user,
        plan: user.plan,
        username: user.username,
      },
    })
    setPlayingSession([])
    if (!errorRestoringSession) return
    expect(errorRestoringSession.code).toBe("OTHER-SESSION-STILL-ON")
  })
})

describe("mobile test suite", () => {
  beforeEach(async () => {
    await setupInstances(
      { validSteamAccounts },
      { steamUserBuilder: new SteamUserMockBuilder(validSteamAccounts, true) }
    )
  })

  test("should require steam guard", async () => {
    const { status } = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: s.me.accountName,
          password,
          userId: s.me.userId,
          authCode: "APSOD",
        },
      })
    )
    expect(status).toBe(201)

    const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
    expect(sac.logged).toBe(true)

    connection.emit("break", { relog: false })

    const steamAccount = await i.steamAccountsRepository.getByAccountName(s.me.accountName)
    if (!steamAccount?.ownerId) throw "account not owned"
    const user = await i.usersRepository.getByID(steamAccount.ownerId)
    if (!user?.plan.id_plan) throw "user 404"
    const plan = await i.planRepository.getById(user?.plan.id_plan)
    if (!plan) throw "plan 404"

    const [errorRestoringSession, result] = await restoreAccountConnectionUseCase.execute({
      steamAccount: {
        accountName: steamAccount.credentials.accountName,
        password: steamAccount.credentials.password,
        autoRestart: steamAccount.autoRelogin,
        isRequiringSteamGuard: steamAccount.isRequiringSteamGuard,
      },
      user: {
        id: user.id_user,
        plan: user.plan,
        username: user.username,
      },
    })
    if (!errorRestoringSession) return
    expect(errorRestoringSession.code).toBe("STEAM-GUARD")
  })
})
