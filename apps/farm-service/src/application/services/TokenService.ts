import { type DataOrFail, Fail, type RoleName } from "core"
import jwt from "jsonwebtoken"
import { bad, nice } from "~/utils/helpers"
import { safer } from "~/utils/safer"

export class TokenService implements ITokenService {
  constructor() {}

  async signIdentification({ role, userId }: TokenServicePayload) {
    const payload = {
      role,
    }
    const [errorSigningRoleName, token] = safer(() =>
      jwt.sign(payload, process.env.TOKEN_IDENTIFICATION_HASH!, {
        subject: userId,
      })
    )
    if (errorSigningRoleName) {
      return bad(
        new Fail({
          code: "ERROR-SIGNING-IDENTIFICATION-TOKEN",
          httpStatus: 400,
          payload: {
            role,
            userId,
          },
        })
      )
    }

    return nice(token)
  }
}

export type TokenServicePayload = {
  role: RoleName
  userId: string
}

interface ITokenService {
  signIdentification(props: TokenServicePayload): Promise<DataOrFail<Fail, string>>
}
