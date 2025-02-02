import { Events } from "~/application/services/events"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { stopFarmUseCase, usersRepository } from "~/presentation/instances"

// stop farm if sac requires steam guard
Events.on("account_required_steam_guard", async (userId, accountName) => {
  const [errorGettingUser, user] = await getUser(usersRepository, userId)
  if (errorGettingUser) return notifyError(errorGettingUser)
  const [errorStoppingFarm] = await stopFarmUseCase.execute({
    accountName,
    isFinalizingSession: true,
    username: user.username,
  })

  if (errorStoppingFarm) {
    switch (errorStoppingFarm.code) {
      case "DO-NOT-HAVE-ACCOUNTS-FARMING":
      case "TRIED-TO-STOP-FARM-ON-NON-FARMING-ACCOUNT":
        break
      default:
        return notifyError(errorStoppingFarm)
    }
  }
})

// change require steam guard on db -> true
Events.on("account_required_steam_guard", async (userId, accountName) => {
  const [errorGettingUser, user] = await getUser(usersRepository, userId)
  if (errorGettingUser) return notifyError(errorGettingUser)
  const steamAccount = user.steamAccounts.getByAccountName(accountName)
  if (!steamAccount) return
  steamAccount.requireSteamGuard()
  await usersRepository.update(user)
})

// change require steam guard on db -> false
Events.on("account_logged_in", async (userId, accountName, wasRequiringSteamGuard) => {
  if (!wasRequiringSteamGuard) return
  const [errorGettingUser, user] = await getUser(usersRepository, userId)
  if (errorGettingUser) return notifyError(errorGettingUser)
  const steamAccount = user.steamAccounts.getByAccountName(accountName)
  if (!steamAccount) return
  steamAccount.provideSteamGuard()
  await usersRepository.update(user)
})

function notifyError(error: any) {
  console.log("ERROR!! ", error)
}
