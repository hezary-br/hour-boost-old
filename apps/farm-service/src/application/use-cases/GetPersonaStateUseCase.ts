import type {
  DataOrError,
  DataOrFail,
  Fail,
  SteamAccountClientStateCacheRepository,
  SteamAccountPersonaState,
} from "core"
import type { RefreshPersonaStateUseCase } from "~/application/use-cases/RefreshPersonaStateUseCase"
import { nice } from "~/utils/helpers"

interface IGetPersonaStateUseCase {
  execute(input: IGetPersonaState.Input): Promise<DataOrFail<Fail | Error, SteamAccountPersonaState>>
}

export class GetPersonaStateUseCase implements IGetPersonaStateUseCase {
  constructor(
    private readonly steamAccountClientStateCacheRepository: SteamAccountClientStateCacheRepository,
    private readonly refreshPersonaState: RefreshPersonaStateUseCase
  ) {}

  async execute(input: IGetPersonaState.Input) {
    const foundPersona = await this.steamAccountClientStateCacheRepository.getPersona(input.accountName)
    if (foundPersona) return nice(foundPersona)
    return await this.refreshPersonaState.execute(input)
  }
}

export namespace IGetPersonaState {
  export type Input = {
    accountName: string
    userId: string
  }
  export type Output = Promise<DataOrError<SteamAccountPersonaState>>
}
