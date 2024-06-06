import {
  type DataOrFail,
  Fail,
  type SteamAccountClientStateCacheRepository,
  type SteamAccountPersonaState,
} from "core"
import type { AllUsersClientsStorage } from "~/application/services"
import { EAppResults } from "~/application/use-cases"
import { bad, nice } from "~/utils/helpers"

export class RefreshPersonaStateUseCase {
  constructor(
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly allUsersClientsStorage: AllUsersClientsStorage
  ) {}

  async execute(input: IRefreshPersonaState.Input) {
    const sac = this.allUsersClientsStorage.getAccountClient(input.userId, input.accountName)
    if (!sac) {
      return bad(
        Fail.create(EAppResults["SAC-NOT-FOUND"], 404, {
          input,
          existingAccounts: this.allUsersClientsStorage.listUsersKeys(),
        })
      )
    }
    const [error, persona] = await sac.getAccountPersona()
    if (error) return bad(error)
    await this.steamAccountClientStateCacheRepository.setPersona(input.accountName, persona)
    return nice(persona)
  }
}

export namespace IRefreshPersonaState {
  export type Input = {
    userId: string
    accountName: string
  }
  export type Output = Promise<DataOrFail<Fail, SteamAccountPersonaState>>
}
