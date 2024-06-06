import {
  type AddSteamAccount,
  type AddSteamAccountHTTPResponse,
  ApplicationError,
  type DataOrError,
  type UseCase,
  type UsersDAO,
} from "core"
import type { AllUsersClientsStorage } from "~/application/services"
import { HashService } from "~/application/services/HashService"
import type { CheckSteamAccountOwnerStatusUseCase } from "~/application/use-cases"
import { EVENT_PROMISES_TIMEOUT_IN_SECONDS } from "~/consts"
import { SteamClientEventsRequired } from "~/utils/SteamClientEventsRequired"
import { bad } from "~/utils/helpers"

export namespace AddSteamAccountUseCaseHandle {
  export type Payload = {
    accountName: string
    password: string
    userId: string
    authCode?: string
  }

  export type Response = DataOrError<AddSteamAccountHTTPResponse>
}

export class AddSteamAccountUseCase
  implements UseCase<AddSteamAccountUseCaseHandle.Payload, Promise<AddSteamAccountUseCaseHandle.Response>>
{
  constructor(
    private readonly addSteamAccount: AddSteamAccount,
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly usersDAO: UsersDAO,
    private readonly checkSteamAccountOwnerStatusUseCase: CheckSteamAccountOwnerStatusUseCase,
    private readonly hashService: HashService
  ) {}

  async execute({ accountName, password, userId, authCode }: APayload): AResponse {
    const { username } = (await this.usersDAO.getUsername(userId)) ?? {}
    const planId = await this.usersDAO.getPlanId(userId)
    if (!planId)
      return [
        new ApplicationError(`Nenhum plano encontrado para userId: [${userId}] com planId: [${planId}]`),
      ]
    if (!username) return [new ApplicationError("Nenhum usuário encontrado com esse id.")]

    const [errorCheckingUserOwnerStatus, accountOwnerStatus] =
      await this.checkSteamAccountOwnerStatusUseCase.execute({
        accountName,
        userId,
      })
    if (errorCheckingUserOwnerStatus) return [errorCheckingUserOwnerStatus]
    if (accountOwnerStatus === "OWNED_BY_OTHER_USER")
      return [new ApplicationError("Essa conta da Steam já foi registrada por outro usuário.", 403)]
    if (accountOwnerStatus === "OWNED_BY_USER")
      return [new ApplicationError("Você já possui essa conta cadastrada.")]

    const [sac, removeSAC] = this.allUsersClientsStorage.getOrAddSteamAccountUnsub({
      accountName,
      userId,
      username,
      planId,
      autoRestart: false,
      isRequiringSteamGuard: false,
    })

    const [errorEncrypting, hashPassword] = this.hashService.encrypt(password)
    if (errorEncrypting) return bad(errorEncrypting)

    if (sac.logged) {
      const [error, result] = await this.addSteamAccount.execute({
        accountName,
        password: hashPassword,
        userId,
      })
      if (error) {
        switch (error.code) {
          case "ACCOUNTS_LIMIT_REACHED":
            return [new ApplicationError("Limite de contas alcançado.")]
          case "ALREADY_HAS_ACCOUNT_WITH_THIS_NAME":
            return [new ApplicationError("Já possui uma conta com esse nome.")]
          case "USER_NOT_FOUND":
            return [new ApplicationError("Usuário não encontrado.")]
          default:
            error satisfies never
        }
        throw error
      }

      return [
        null,
        {
          message: `${accountName} adicionada com sucesso!`,
          steamAccountId: result.steamAccountId,
        },
      ]
    }
    sac.login(accountName, password, authCode)

    const steamClientEventsRequired = new SteamClientEventsRequired(sac, EVENT_PROMISES_TIMEOUT_IN_SECONDS)

    console.log("Never resolving IN")
    const eventsPromisesResolved = await Promise.race(
      steamClientEventsRequired.getEventPromises({
        loggedOn: true,
        steamGuard: true,
        error: true,
        timeout: true,
      })
    )
    console.log("Never resolving OUT")

    switch (eventsPromisesResolved.type) {
      case "loggedOn":
      case "steamGuard":
        break // should mantain sac on system for later
      default:
        console.log("33: removing sac")
        removeSAC()
    }

    if (eventsPromisesResolved.type === "steamGuard") {
      const [domain, setCode] = eventsPromisesResolved.args
      sac.setManualHandler("steamGuard", code => setCode(code))
      return [
        new ApplicationError(
          `Steam Guard requerido. Enviando para ${domain ? `e-mail com final ${domain}` : `seu celular.`}`,
          202
        ),
      ]
    }

    if (eventsPromisesResolved.type === "error") {
      const [error] = eventsPromisesResolved.args
      if (error.eresult === 18)
        return [
          new ApplicationError(
            "Steam Account não existe no banco de dados da Steam, delete essa conta e crie novamente.",
            404,
            error
          ),
        ]
      if (error.eresult === 5) return [new ApplicationError("Conta ou senha incorretas.", 403, error)]
      return [
        new ApplicationError("Aconteceu algum erro no client da Steam.", 400, {
          eresult: error.eresult,
        }),
      ]
    }

    if (eventsPromisesResolved.type === "loggedOn") {
      const [error, result] = await this.addSteamAccount.execute({
        accountName,
        password: hashPassword,
        userId,
      })

      if (error) {
        switch (error.code) {
          case "ACCOUNTS_LIMIT_REACHED":
            return [new ApplicationError("Limite de contas alcançado.")]
          case "ALREADY_HAS_ACCOUNT_WITH_THIS_NAME":
            return [new ApplicationError("Já possui uma conta com esse nome.")]
          case "USER_NOT_FOUND":
            return [new ApplicationError("Usuário não encontrado.")]
          default:
            error satisfies never
        }
        throw error
      }

      const { steamAccountId } = result

      // 22: salvar auth code no banco de dados

      return [
        null,
        {
          message: `${accountName} adicionada com sucesso!`,
          steamAccountId,
        },
      ]
    }
    return [
      new ApplicationError("Erro desconhecido", 400, {
        accountName,
        password,
        userId,
        authCode,
      }),
    ]
  }
}

type APayload = AddSteamAccountUseCaseHandle.Payload
type AResponse = Promise<AddSteamAccountUseCaseHandle.Response>
