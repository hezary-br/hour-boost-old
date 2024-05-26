import { AddSteamAccount } from "core"
import { makeTestInstances, password, validSteamAccounts } from "~/__tests__/instances"
import { AutoRestartCron } from "~/application/cron/AutoRestartCron"
import {
  AddSteamAccountUseCase,
  CreateUserUseCase,
  RestoreAccountConnectionUseCase,
  RestoreAccountSessionUseCase,
  ScheduleAutoRestartUseCase,
} from "~/application/use-cases"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { AutoRestarterScheduler } from "~/domain/cron/AutoRestarterScheduler"
import { testUsers as s } from "~/infra/services/UserAuthenticationInMemory"

const i = makeTestInstances(
  {
    validSteamAccounts,
  }
  // {
  //   steamUserBuilder: new SteamUserMockBuilder(validSteamAccounts, true),
  // }
)

const autoRestarterScheduler = new AutoRestarterScheduler()
const createUser = new CreateUserUseCase(
  i.usersRepository,
  i.userAuthentication,
  i.usersClusterStorage,
  i.initUserGateway
)

const addSteamAccount = new AddSteamAccount(i.usersRepository, i.idGenerator)
const addSteamAccountUseCase = new AddSteamAccountUseCase(
  addSteamAccount,
  i.allUsersClientsStorage,
  i.usersDAO,
  i.checkSteamAccountOwnerStatusUseCase,
  i.hashService
)
const restoreAccountSessionUseCase = new RestoreAccountSessionUseCase(i.usersClusterStorage, i.publisher)
const restoreAccountConnectionUseCase = new RestoreAccountConnectionUseCase(
  i.allUsersClientsStorage,
  i.usersClusterStorage,
  i.sacStateCacheRepository,
  i.hashService
)
const autoRestartCron = new AutoRestartCron(
  i.allUsersClientsStorage,
  i.planRepository,
  i.steamAccountsRepository,
  restoreAccountConnectionUseCase,
  restoreAccountSessionUseCase,
  i.usersDAO,
  i.sacStateCacheRepository
)

async function main() {
  await createUser.execute(s.me.userId)
  const [errorAddSteamAccountUseCase] = await addSteamAccountUseCase.execute({
    accountName: s.me.accountName,
    password,
    authCode: "12345",
    userId: s.me.userId,
  })

  if (errorAddSteamAccountUseCase) {
    console.log({ msg: errorAddSteamAccountUseCase.message, code: errorAddSteamAccountUseCase.code })
    return
  }
  // connection.emit("break")

  const sac = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
  console.log("first sac status: ", sac.logged)
  console.log({ cronKeys: autoRestarterScheduler.listCronsKeys() })
  const scheduleAutoRestartUseCase = new ScheduleAutoRestartUseCase(autoRestarterScheduler, autoRestartCron)
  const [errorScheduling] = await scheduleAutoRestartUseCase.execute({
    accountName: s.me.accountName,
    intervalInSeconds: 15,
  })
  if (errorScheduling) {
    ctxLog({ code: errorScheduling.code })
    return
  }
  const sac2 = i.allUsersClientsStorage.getAccountClientOrThrow(s.me.userId, s.me.accountName)
  console.log("second sac status: ", sac2.logged)
}

main()
