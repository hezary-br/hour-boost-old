import { RoleName, StatusName } from "core"
import jwt from "jsonwebtoken"

export type HBIdentification = jwt.JwtPayload & {
  userId: string
  role: RoleName
  status: StatusName
}

export type HBHasUser = boolean
export type HBHasId = string
