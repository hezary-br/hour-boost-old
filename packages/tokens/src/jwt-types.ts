import { RoleName } from "core"
import jwt from "jsonwebtoken"

export type HBIdentification = jwt.JwtPayload & {
  userId: string
  role: RoleName
}
