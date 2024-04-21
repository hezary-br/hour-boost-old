import { ApplicationError } from "core"
import type { AllUsersClientsStorage } from "~/application/services"
import { EVENT_PROMISES_TIMEOUT_IN_SECONDS } from "~/consts"
import { ResponseAPI } from "~/types/response-api"
import { SteamClientEventsRequired } from "~/utils/SteamClientEventsRequired"

type AddSteamGuardCodeControllerProps = {
  code: string
  userId: string
  accountName: string
}

export class AddSteamGuardCodeController {
  constructor(private readonly allUsersClientsStorage: AllUsersClientsStorage) {}

  async handle({ userId, accountName, code }: AddSteamGuardCodeControllerProps): Promise<ResponseAPI> {
    const { userSteamClients } = this.allUsersClientsStorage.getOrNull(userId) ?? {}
    if (!userSteamClients)
      throw new ApplicationError(
        "Falha ao adicionar código Steam Guard. Usuário nunca tentou fazer login com essa conta."
      )
    const sac = userSteamClients.getAccountClientOrThrow(accountName)
    if (!sac) throw new ApplicationError("User never tried to log in.")

    const steamGuardArguments = sac.getLastArguments("steamGuard")
    console.log({ steamGuardArguments })
    if (!steamGuardArguments) {
      return {
        status: 400,
        json: {
          message: "Código Steam Guard não foi solicitado.",
        },
      }
    }
    const [, addCode] = steamGuardArguments
    addCode(code)

    const steamClientEventsRequired = new SteamClientEventsRequired(sac, EVENT_PROMISES_TIMEOUT_IN_SECONDS)

    const eventsPromisesResolved = await Promise.race(
      steamClientEventsRequired.getEventPromises({
        loggedOn: true,
        steamGuard: true,
        error: true,
        timeout: true,
      })
    )

    if (eventsPromisesResolved.type === "loggedOn") {
      // 22: persistir auth code

      return {
        status: 200,
        json: eventsPromisesResolved.args,
      }
    }
    if (eventsPromisesResolved.type === "steamGuard") {
      return {
        status: 400,
        json: {
          message: "Bad input. Steam Guard foi solicitado novamente.",
        },
      }
    }

    throw new ApplicationError("Bad resolver, didn't throw or returned logged in event.")
  }
}
