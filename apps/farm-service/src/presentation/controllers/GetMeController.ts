import { type DataOrFail, Fail, type UsersDAO, type UsersRepository } from "core"
import type { TokenService } from "~/application/services/TokenService"
import type { CreateUserUseCase } from "~/application/use-cases/CreateUserUseCase"
import { bad, nice } from "~/utils/helpers"

export class GetMeController implements IGetMeController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly usersDAO: UsersDAO,
    private readonly tokenService: TokenService
  ) {}

  async handle({ userId }: GetMeControllerPayload) {
    let created = false
    try {
      if (!userId) return nice({ code: "NO-USER-ID-PROVIDED" })
      const user = await this.usersRepository.getByID(userId)
      if (!user) {
        await this.createUserUseCase.execute(userId)
        created = true
      }
      const userSession = await this.usersDAO.getByID(userId)
      if (!userSession)
        return bad(
          Fail.create("USER-SESSION-NOT-FOUND", 404, {
            userSession,
            userId,
          })
        )
      const [errorSigningRoleName, identificationToken] = await this.tokenService.signIdentification({
        role: userSession.role,
        userId: userSession.id,
      })

      if (errorSigningRoleName) return bad(errorSigningRoleName)

      return nice({
        userSession,
        tokens: {
          ["hb-identification"]: identificationToken,
        },
        code: created ? "USER-SESSION::CREATED" : "USER-SESSION::FOUND",
      })
    } catch (error) {
      console.log(error)
      return bad(Fail.create("ERROR", 500, { error }))
    }
  }
}

export type GetMeControllerPayload = {
  userId: string | null
}

interface IGetMeController {
  handle(props: GetMeControllerPayload): Promise<DataOrFail<Fail, object>>
}
