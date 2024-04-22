import { ApplicationError, type Controller, type HttpClient, type UsersRepository } from "core"
import type { StopFarmUseCase } from "~/application/use-cases/StopFarmUseCase"

export namespace StopFarmHandle {
  export type Payload = {
    userId: string
    accountName: string
  }

  export type Response = null | { message: string }
}

export class StopFarmController implements Controller<StopFarmHandle.Payload, StopFarmHandle.Response> {
  constructor(
    private readonly stopFarmUseCase: StopFarmUseCase,
    private readonly usersRepository: UsersRepository
  ) {}

  async handle({ payload }: APayload) {
    const { userId, accountName } = payload
    const user = await this.usersRepository.getByID(userId)
    if (!user) return makeMessageFactory({ code: "NOT_FOUND", httpStatus: 404 })("Usuário não encontrado.")

    const [errorPausingFarm] = await this.stopFarmUseCase.execute({
      accountName,
      username: user.username,
      isFinalizingSession: true,
    })

    if (errorPausingFarm) {
      const makeMessage = makeMessageFactory(errorPausingFarm)
      if (errorPausingFarm instanceof ApplicationError) throw errorPausingFarm
      switch (errorPausingFarm.code) {
        case "PLAN-NOT-FOUND":
          return makeMessage(`Plano com id [${errorPausingFarm.payload.givenPlanId}] não foi encontrado.`)
        case "PAUSE-FARM-ON-ACCOUNT-NOT-FOUND":
        case "TRIED-TO-STOP-FARM-ON-NON-FARMING-ACCOUNT":
          return makeMessage("Você já não está farmando.")
        case "DO-NOT-HAVE-ACCOUNTS-FARMING":
          return makeMessage("Usuário não possui contas farmando.")
        case "[Users-Cluster-Storage]:CLUSTER-NOT-FOUND":
          return makeMessage("Aconteceu um erro, tente novamente mais tarde.", "ERROR", 400)
        default:
          errorPausingFarm satisfies never
      }
    }
    return {
      json: {
        message: "Farm pausado com sucesso.",
        code: "SUCCESS",
      },
      status: 200,
    }
  }
}

type APayload = HttpClient.Request<StopFarmHandle.Payload>

type GenericFail = { code: string; httpStatus: number }
function makeMessageFactory<T extends GenericFail>(error: T) {
  return function makeMessage(message: string, code?: string, status?: number) {
    return {
      json: {
        message,
        code: code ?? error.code,
      },
      status: status ?? error.httpStatus,
    }
  }
}
