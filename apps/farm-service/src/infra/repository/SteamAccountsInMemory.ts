import { type SteamAccount, makeError } from "core"

export class SteamAccountsInMemory {
  steamAccounts: SteamAccount[] = []

  get ids() {
    return this.steamAccounts.map(sa => sa.id_steamAccount)
  }

  get accountNamesInDB() {
    return this.steamAccounts.map(sa => sa.credentials.accountName)
  }

  updateAccounts(accounts: SteamAccount[]) {
    for (const account of accounts) {
      this.addOrUpdate(account)
    }
  }

  getByAccountName(accountName: string) {
    const foundSteamAccount = this.steamAccounts.find(sa => sa.credentials.accountName === accountName)
    if (!foundSteamAccount) {
      // return null
      throw makeError("NTSH: getById() tried to find account id but was not able to.", {
        steamAccountId: accountName,
        accountsInMemory: this.steamAccounts.map(sa => ({
          accountName: sa.credentials.accountName,
          id: sa.id_steamAccount,
        })),
      })
    }
    return foundSteamAccount
  }

  private count = 0

  addIfDontExists(steamAccounts: SteamAccount[]) {
    for (const sa of steamAccounts) {
      if (this.accountNamesInDB.includes(sa.credentials.accountName)) continue
      this.steamAccounts.push(sa)
    }
    this.count++
  }

  addOrUpdate(steamAccount: SteamAccount) {
    if (this.accountNamesInDB.includes(steamAccount.credentials.accountName)) {
      this.steamAccounts = this.steamAccounts.map(sa =>
        sa.credentials.accountName === steamAccount.credentials.accountName ? steamAccount : sa
      )
      return
    }
    this.steamAccounts.push(steamAccount)
  }

  disownSteamAccounts(ids: string[]) {
    for (const removedSteamAccount of ids) {
      const steamAccount = this.steamAccounts.find(sa => sa.id_steamAccount === removedSteamAccount)
      if (!steamAccount) {
        throw makeError("NTSH: tried to find account id but was not able to.", {
          givenId: removedSteamAccount,
          accountsInMemory: this.steamAccounts.map(sa => ({
            accountName: sa.credentials.accountName,
            id: sa.id_steamAccount,
          })),
        })
      }
      steamAccount.disown()
      this.steamAccounts = this.steamAccounts.map(sa =>
        sa.credentials.accountName === steamAccount.credentials.accountName ? steamAccount : sa
      )
    }
  }

  disownSteamAccountsAll() {
    const ids = this.steamAccounts.map(sa => sa.id_steamAccount)
    this.disownSteamAccounts(ids)
  }
}
