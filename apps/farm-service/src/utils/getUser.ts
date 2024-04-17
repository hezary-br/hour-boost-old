import type { PlanInfinity, PlanUsage, User } from "core"
import type { AllUsersClientsStorage, UserClientsStorage } from "~/application/services"
import { EAppResults } from "~/application/use-cases"
import { nonNullable } from "~/utils/nonNullable"
import { updateCacheStates } from "~/utils/updateCacheStates"
import { bad, nice } from "./helpers"

export function getUserSACs_OnStorage_ByUser_UpdateStates(
  user: User,
  allUsersClientsStorage: AllUsersClientsStorage,
  plan: PlanUsage | PlanInfinity
) {
  const [errorGettingUserSACList, userSacList] = getUserSACs_OnStorage_ByUser(user, allUsersClientsStorage)
  if (errorGettingUserSACList) return bad(errorGettingUserSACList)

  const currentSACStates = userSacList.filter(nonNullable).map(sac => sac.getCache())
  const updatedCacheStates = updateCacheStates({
    currentSACStates,
    plan,
  })

  return nice(updatedCacheStates)
}
export function getUserSACs_OnStorage_ByUser(user: User, allUsersClientsStorage: AllUsersClientsStorage) {
  const userClientStorage = allUsersClientsStorage.get(user.id_user)
  if (!userClientStorage)
    return bad({
      code: EAppResults["USER-STORAGE-NOT-FOUND"],
      userClientStorage,
      givenUserId: user.id_user,
      usersInStorage: allUsersClientsStorage.listUsersKeys().join(", "),
    })
  return nice(
    getUserSACs_OnStorage(
      user.steamAccounts.data.map(sa => sa.credentials.accountName),
      userClientStorage
    )
  )
}

export function getUserSACs_OnStorage_ByUserId(
  userId: string,
  allUsersClientsStorage: AllUsersClientsStorage
) {
  const userClientStorage = allUsersClientsStorage.get(userId)
  if (!userClientStorage)
    return bad({
      code: EAppResults["USER-STORAGE-NOT-FOUND"],
      userClientStorage,
      givenUserId: userId,
      usersInStorage: allUsersClientsStorage.listUsersKeys().join(", "),
    })
  return (accountNameList: string[]) => getUserSACs_OnStorage(accountNameList, userClientStorage)
}

export function getUserSACs_OnStorage(accountNameList: string[], userClientStorage: UserClientsStorage) {
  return accountNameList
    .map(accountName => {
      return userClientStorage.getAccountClient(accountName)
    })
    .filter(nonNullable)
}
