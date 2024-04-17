import { HBHeaders } from "@hourboost/tokens"
import { CreateUserUseCase } from "~/application/use-cases"
import { token } from "~/infra/singletons/token-factory"
import { Header, ResponseAPI, createResponse, createResponseNoJSON } from "~/types/response-api"
import { saferAsync } from "~/utils/safer"

export class CreateMeController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle({ userId }: CreateMeControllerProps): Promise<ResponseAPI> {
    if (!userId) {
      return createResponse(405, { message: "Nenhum user id foi fornecido." })
    }

    console.log(`Create/me called with id [${userId}], creating user...`)
    const [error, me] = await saferAsync(() => this.createUserUseCase.execute(userId))
    if (error) {
      return createResponse(400, {
        code: "ERROR-WHILE-CREATING-USER",
        error,
      })
    }

    const [errorSigningToken, userToken] = token.createHBIdentification({
      role: me.role.name,
      userId,
      status: me.status.name,
    })
    if (errorSigningToken) {
      return createResponseNoJSON(400)
    }

    const headers: Header[] = []
    headers.push({ name: HBHeaders["hb-has-id"], value: "true" })
    headers.push({ name: HBHeaders["hb-has-user"], value: "true" })
    headers.push({ name: HBHeaders["hb-identification"], value: userToken })

    return {
      status: 201,
      headers,
      json: {
        code: "USER-CREATED",
        error: null,
      },
    }
  }
}

type CreateMeControllerProps = {
  userId: string | null
}
