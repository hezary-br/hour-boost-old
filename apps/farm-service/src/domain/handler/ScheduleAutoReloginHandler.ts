import type { ErrorOccuredOnSteamClientCommand } from "~/application/commands"
import type { ScheduleAutoRestartUseCase } from "~/application/use-cases"
import { env } from "~/env"
import type { EventNames, Observer } from "~/infra/queue"
import { thisErrorShouldScheduleAutoRestarter } from "~/utils/shouldScheduleAutoRestater"

export class ScheduleAutoRestartHandler implements Observer {
  operation: EventNames = "error-occured-on-steam-client"

  constructor(private readonly scheduleAutoRestartUseCase: ScheduleAutoRestartUseCase) {}

  async notify({ accountName, errorEResult }: ErrorOccuredOnSteamClientCommand): Promise<void> {
    if (!thisErrorShouldScheduleAutoRestarter(errorEResult)) return
    const [failSchedulingAutoRestart] = await this.scheduleAutoRestartUseCase.execute({
      accountName,
      intervalInSeconds: env.AUTO_RESTARTER_INTERVAL_IN_MINUTES * 60,
    })
    if (failSchedulingAutoRestart) console.log({ failSchedulingAutoRestart })
  }
}
