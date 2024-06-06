import type { SteamAccountClient } from "~/application/services/steam"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import type { EventParameters } from "~/infra/services"
import {
  type EventParametersTimeout,
  type FarmGamesEventsResolve,
  SingleEventResolver,
} from "~/types/EventsApp.types"

type RequiredEventTimeoutNames = keyof (EventParameters & EventParametersTimeout)
export type EventPromises = Partial<Record<RequiredEventTimeoutNames, boolean>>

export class SteamClientEventsRequired {
  constructor(
    private readonly sac: SteamAccountClient,
    private readonly timeoutLimitInSeconds: number
  ) {}

  createEventPromiseResolver<K extends keyof EventParameters>(eventName: K) {
    return new Promise<SingleEventResolver<EventParameters, K>>(res => {
      if (eventName === "loggedOn") ctxLog("logged, setting lastHandler")
      this.sac.setLastHandler(eventName, (...args) => res(new SingleEventResolver({ type: eventName, args })))
      // this.sac.client.on(eventName, (...args) => res({ type: eventName, args }))
    })
  }

  createTimeoutPromiseResolver(timeInSeconds: number) {
    return new Promise<SingleEventResolver<EventParametersTimeout, "timeout">>(res =>
      setTimeout(() => {
        res({ type: "timeout", args: [] })
      }, timeInSeconds * 1000).unref()
    )
  }

  getEventPromises(needEvent: EventPromises) {
    const promises: Array<Promise<FarmGamesEventsResolve<EventParameters & EventParametersTimeout>>> = []

    if (needEvent.loggedOn) {
      promises.push(this.createEventPromiseResolver("loggedOn"))
    }
    if (needEvent.steamGuard) {
      promises.push(this.createEventPromiseResolver("steamGuard"))
    }
    if (needEvent.error) {
      promises.push(this.createEventPromiseResolver("error"))
    }
    if (needEvent.timeout) {
      promises.push(this.createTimeoutPromiseResolver(this.timeoutLimitInSeconds))
    }

    return promises
  }
}
