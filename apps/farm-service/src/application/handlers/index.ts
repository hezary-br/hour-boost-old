import { Events } from "~/application/services/events"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { usersRepository } from "~/presentation/instances"

Events.on("account_required_steam_guard", async (userId, accountName) => {
  const [errorGettingUser, user] = await getUser(usersRepository, userId)
  if (errorGettingUser) return notifyError(errorGettingUser)
  const steamAccount = user.steamAccounts.getByAccountName(accountName)
  if (!steamAccount) return notifyError(`${accountName} not found.`)
  steamAccount.requireSteamGuard()
  await usersRepository.update(user)
})

Events.on("account_logged_in", async (userId, accountName, wasRequiringSteamGuard) => {
  if(!wasRequiringSteamGuard) return
  const [errorGettingUser, user] = await getUser(usersRepository, userId)
  if (errorGettingUser) return notifyError(errorGettingUser)
  const steamAccount = user.steamAccounts.getByAccountName(accountName)
  if (!steamAccount) return notifyError(`${accountName} not found.`)
  steamAccount.provideSteamGuard()
  await usersRepository.update(user)
})

function notifyError(error: any) {
  console.log("ERROR!! ", error)
}
