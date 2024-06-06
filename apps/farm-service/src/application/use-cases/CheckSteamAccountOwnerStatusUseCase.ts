import {
  ApplicationError,
  type DataOrError,
  SteamAccount,
  type SteamAccountsRepository,
  type UseCase,
} from "core"

export namespace CheckSteamAccountOwnerStatusUseCaseHandle {
  export type Payload = {
    userId: string
    accountName: string
  }

  export type Response = Promise<
    DataOrError<"NOT_OWNED" | "OWNED_BY_USER" | "OWNED_BY_OTHER_USER" | "NEVER_REGISTERED">
  >
}

export class CheckSteamAccountOwnerStatusUseCase
  implements
    UseCase<
      CheckSteamAccountOwnerStatusUseCaseHandle.Payload,
      CheckSteamAccountOwnerStatusUseCaseHandle.Response
    >
{
  constructor(private readonly steamAccountsRepository: SteamAccountsRepository) {}

  async execute({ userId, accountName }: APayload): AResponse {
    try {
      const foundSteamAccount = await this.steamAccountsRepository.getByAccountName(accountName)
      if (foundSteamAccount instanceof SteamAccount) {
        if (!foundSteamAccount.ownerId) return [null, "NOT_OWNED"]
        const userIsAccountOwner = foundSteamAccount.ownerId === userId
        return [null, userIsAccountOwner ? "OWNED_BY_USER" : "OWNED_BY_OTHER_USER"]
      } else if (foundSteamAccount == null) return [null, "NEVER_REGISTERED"]
      return [new ApplicationError("Erro desconhecido da aplicação.", 400)]
    } catch (error) {
      return [new ApplicationError("Erro desconhecido no servidor.", 500)]
    }
  }
}

type APayload = CheckSteamAccountOwnerStatusUseCaseHandle.Payload
type AResponse = CheckSteamAccountOwnerStatusUseCaseHandle.Response
