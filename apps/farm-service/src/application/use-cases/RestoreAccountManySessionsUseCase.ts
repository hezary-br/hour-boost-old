import { AsyncLocalStorage } from "node:async_hooks"
import type { SteamAccountsDAO } from "core"
import SteamUser from "steam-user"
import type { AutoRestartCron } from "~/application/cron/AutoRestartCron"
import { __recoveringAccounts } from "~/momentarily"
import { Logger } from "~/utils/Logger"
import { type ExecutePromisesInBatchProps, executePromisesInBatch } from "~/utils/executePromisesInBatch"
import { bad, nice } from "~/utils/helpers"

export type BatchOptions = Pick<
  ExecutePromisesInBatchProps,
  "batchAmount" | "noiseInSeconds" | "intervalInSeconds"
>

type RestoreAccountManySessionsUseCasePayload = {
  whitelistAccountNames?: string[]
  batchOptions: BatchOptions
}

export class RestoreAccountManySessionsUseCase {
  logger = new Logger("Restore-Account-Session")

  constructor(
    private readonly steamAccountsDAO: SteamAccountsDAO,
    private readonly autoRestartCron: AutoRestartCron
  ) {}

  async execute({ whitelistAccountNames, batchOptions }: RestoreAccountManySessionsUseCasePayload) {
    const allAccountNameList = await this.steamAccountsDAO.listAccountNames({
      filter: { onlyOwnedAccounts: true },
    })
    allAccountNameList.forEach(accountName => __recoveringAccounts.add(accountName))
    const accountNameList = whitelistAccountNames
      ? allAccountNameList.filter(accName => whitelistAccountNames.includes(accName))
      : allAccountNameList

    this.logger.log({
      allAccountNameList,
      accountNameList,
    })

    const sessionRestart = getSessionRestart(this.autoRestartCron, accountNameList)

    await executePromisesInBatch({
      ...batchOptions,
      promiseList: sessionRestart,
    })

    return nice({
      promisesAmount: sessionRestart.length,
    })
  }
}

export const ALS_accountName = new AsyncLocalStorage<string>()
export const ALS_username = new AsyncLocalStorage<string>()
export const ALS_moduleName = new AsyncLocalStorage<string>()

export const ctxLog = (...args: any[]) => {
  let prefix = []
  const username = ALS_username.getStore()
  if (username) prefix.push(`[${username}]`)
  const accountName = ALS_accountName.getStore()
  if (accountName) prefix.push(`[${accountName}]`)
  const moduleName = ALS_moduleName.getStore()
  if (moduleName) prefix.push(`[${moduleName}]`)
  console.log(prefix.join(" ").concat(" -"), ...args)
}

const getSessionRestart = (autoRestartCron: AutoRestartCron, accountNameList: string[]) => {
  return accountNameList.map(accountName => {
    // ALS_accountName.
    return {
      accountName,
      getPromise: async () => {
        // return new Promise(resolve => {
        return await ALS_accountName.run(accountName, async () => {
          const [errorAutoRestart, reslt] = await autoRestartCron.run({
            accountName,
            forceRestoreSessionOnApplication: true,
          })

          if (errorAutoRestart) {
            switch (errorAutoRestart.code) {
              case "cluster.farmWithAccount()::UNKNOWN-CLIENT-ERROR":
                if (errorAutoRestart.payload.eresult === SteamUser.EResult.LoggedInElsewhere) {
                  ctxLog("Light client error: Está com sessão ativa em outro dispositivo.")
                  break
                }
              default:
                console.log({ code: errorAutoRestart.payload, payload: errorAutoRestart.payload })
                return bad(errorAutoRestart)
            }
          }
          return nice(reslt)
        })
        // })
      },
    }
  })
}

export type SessionRestart = ReturnType<typeof getSessionRestart>[number]
