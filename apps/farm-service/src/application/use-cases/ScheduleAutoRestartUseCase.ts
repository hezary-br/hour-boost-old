import { appendFile } from "fs"
import { type DataOrFail, Fail } from "core"
import type { AutoRestartCron } from "~/application/cron/AutoRestartCron"
import type { AutoRestarterScheduler } from "~/domain/cron"
import { Logger } from "~/utils/Logger"
import { bad, nice } from "~/utils/helpers"

export type ScheduleAutoRestartPayload = {
  accountName: string
  intervalInSeconds: number
}

interface IScheduleRestartRelogin {
  execute(...args: any[]): Promise<DataOrFail<Fail>>
}

export class ScheduleAutoRestartUseCase implements IScheduleRestartRelogin {
  private readonly logger = new Logger("schedule-auto-restart-use-case")

  constructor(
    private readonly autoRestarterScheduler: AutoRestarterScheduler,
    private readonly autoRestartCron: AutoRestartCron
  ) {}

  async execute({ accountName, intervalInSeconds }: ScheduleAutoRestartPayload) {
    this.logger.log(`Scheduling a cron for [${accountName}] to run every ${intervalInSeconds} seconds.`)
    const hasCronAlready = this.autoRestarterScheduler.alreadyHasCron(accountName)
    if (hasCronAlready) return bad(new Fail({ code: "ALREADY-HAS-CRON" }))

    const interval = setInterval(async () => {
      const [errorWhileRestarting, result] = await this.autoRestartCron.run({
        accountName,
        forceRestoreSessionOnApplication: true,
      })

      appendFile(
        "logs/scheduler.txt",
        `${new Date().toISOString()} [${accountName}] ${JSON.stringify([errorWhileRestarting, result])} \r\n`,
        () => {}
      )
      if (errorWhileRestarting) {
        this.autoRestarterScheduler.stopCron(accountName)
        this.logger.log(`dismissing cron for account [${accountName}]`)

        switch (errorWhileRestarting.code) {
          case "[AutoRestarterCron]::PLAN-NOT-FOUND":
            this.logger.log(`plano não encontrado com id [${errorWhileRestarting.payload.planId}]`)
            return
          case "STEAM-ACCOUNT-IS-NOT-OWNED":
            this.logger.log(`steam account não não tinha dono {${accountName}}`)
            return
          case "STEAM-ACCOUNT-NOT-FOUND":
            this.logger.log(`steam account não foi encontrada {${accountName}}`)
            return
          case "USER-NOT-FOUND":
            this.logger.log(`usuario não encontrado com id [${errorWhileRestarting.payload.user}]`)
            return
          case "KNOWN-ERROR":
          case "OTHER-SESSION-STILL-ON":
          case "PLAN-DOES-NOT-SUPPORT-AUTO-RELOGIN":
          case "UNKNOWN-APPLICATION-ERROR":
          case "UNKNOWN-CLIENT-ERROR":
          case "[FarmUsageService]:PLAN-MAX-USAGE-EXCEEDED":
          case "[RestoreAccountSessionUseCase]::PLAN-NOT-FOUND":
          case "[RestoreAccountSessionUseCase]::SAC-NOT-FOUND":
          case "[RestoreAccountSessionUseCase]::UNKNOWN-CLIENT-ERROR":
          case "[RestoreAccountSessionUseCase]::[FarmInfinityService]:ACCOUNT-ALREADY-FARMING":
          case "[RestoreAccountSessionUseCase]::DIDNT-ADD-GAMES":
          case "[RestoreAccountSessionUseCase]::SAC-IS-REQUIRING-STEAM-GUARD":
          case "cluster.farmWithAccount()::UNKNOWN-CLIENT-ERROR":
            return this.logger.log(`erro não tratado: ${errorWhileRestarting.code}`)

          default:
            errorWhileRestarting satisfies never
            throw new Error("Error in type.")
        }
      }

      if (result.fatal) {
        this.logger.log(`fatal, dismissing cron for account [${accountName}]`)
        this.autoRestarterScheduler.stopCron(accountName)
      }
    }, 1000 * intervalInSeconds)

    this.autoRestarterScheduler.addCron(accountName, interval)

    return nice()
  }
}
