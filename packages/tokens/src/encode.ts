import { safer } from "@hourboost/utils"
import jwt from "jsonwebtoken"

export function encode<T extends string | object | Buffer>(payload: T) {
  return safer(() => jwt.sign(payload, process.env.TOKEN_IDENTIFICATION_HASH!))
}
