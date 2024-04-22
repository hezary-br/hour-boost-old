import {
  type AppAccountStatus,
  ApplicationError,
  type SteamAccountClientStateCacheRepository,
  type UseCase,
} from "core"
import type { AllUsersClientsStorage } from "~/application/services"
import { bad, nice } from "~/utils/helpers"

export namespace ChangeAccountStatusUseCaseHandle {
  export type Payload = {
    userId: string
    accountName: string
    status: AppAccountStatus
  }
}

export class ChangeAccountStatusUseCase implements UseCase<ChangeAccountStatusUseCaseHandle.Payload> {
  constructor(
    private readonly allUsersClientsStorage: AllUsersClientsStorage,
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository
  ) {}

  async execute({ accountName, userId, status }: APayload) {
    const sac = this.allUsersClientsStorage.getAccountClient(userId, accountName)
    if (!sac) return bad(new ApplicationError("NSTH: Nenhuma conta encontrada."))
    const [error] = sac.setStatus(status)
    if (error) return bad(error)
    await this.steamAccountClientStateCacheRepository.save(sac.getCache())
    return nice(200)
  }
}

type APayload = ChangeAccountStatusUseCaseHandle.Payload
