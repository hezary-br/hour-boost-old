import { SteamAccount, SteamAccountCredentials } from "core/entity"
import { SteamAccountList } from "core/entity/SteamAccountList"

const makeSteamAccountGeneric = (accountName: string, id_steamAccount: string = "123", ownerId: string) =>
  SteamAccount.restore({
    id_steamAccount,
    ownerId,
    autoRelogin: false,
    credentials: SteamAccountCredentials.create({
      accountName,
      password: "acc_pass",
    }),
    isRequiringSteamGuard: false,
  })

const makeSteamAccount = (accountName: string, id_steamAccount: string = "123") => {
  return makeSteamAccountGeneric(accountName, id_steamAccount, "998")
}

test("should move SteamAccount to the trash", async () => {
  const steamAccountList = new SteamAccountList()
  const removedSteamAccount = makeSteamAccount("vitor", "234")
  steamAccountList.add(makeSteamAccount("vitor", "1"))
  steamAccountList.add(removedSteamAccount)
  steamAccountList.add(makeSteamAccount("vitor", "abc"))
  expect(steamAccountList.data).toHaveLength(3)
  const [error] = steamAccountList.remove("234")
  expect(error).toBeNull()
  expect(steamAccountList.data).toHaveLength(2)
  expect(steamAccountList.trash).toStrictEqual([removedSteamAccount])
  expect(steamAccountList.getIDs()).toStrictEqual(["1", "abc"])
  expect(steamAccountList.getTrashIDs()).toStrictEqual(["234"])
})
