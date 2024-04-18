import { ApplicationError, type DataOrError } from "core"
import type { SteamAccountClient } from "~/application/services/steam"
import { EVENT_PROMISES_TIMEOUT_IN_SECONDS } from "~/consts"
import { type EventPromises, SteamClientEventsRequired } from "~/utils/SteamClientEventsRequired"
import { bad, nice } from "~/utils/helpers"

export type Payload = {
  sac: SteamAccountClient
  token: string
  trackEvents: EventPromises
  timeoutInSeconds?: number
}

abstract class ILoginSteamWithToken {
  abstract execute(payload: Payload): Promise<DataOrError<boolean>>
}

export class LoginSteamWithToken implements ILoginSteamWithToken {
  constructor() {}

  async execute({ sac, token, timeoutInSeconds = EVENT_PROMISES_TIMEOUT_IN_SECONDS, trackEvents }: Payload) {
    const steamClientEventsRequired = new SteamClientEventsRequired(sac, timeoutInSeconds)

    const [errorLogginWithToken] = sac.loginWithToken(token)
    if (errorLogginWithToken) {
      console.log("66: ", { errorLogginWithToken })
      return bad(
        new ApplicationError(
          "Não foi possível fazer login na conta da steam, tente novamente mais tarde.",
          errorLogginWithToken.httpStatus,
          undefined,
          errorLogginWithToken.code,
          errorLogginWithToken.payload
        )
      )
    }

    const eventsPromisesResolved = await Promise.race(steamClientEventsRequired.getEventPromises(trackEvents))

    if (eventsPromisesResolved.type === "loggedOn") {
      return nice(true)
    }

    // remover refresh token do cache

    return bad(
      new ApplicationError(
        "Wasn't able to connect to Steam.",
        400,
        undefined,
        "WAS_NOT_ABLE_TO_CONNECT_TO_STEAM",
        eventsPromisesResolved
      )
    )
  }
}
