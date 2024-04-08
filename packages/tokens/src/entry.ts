import { safer } from "@hourboost/utils"
import jwt from "jsonwebtoken"
import { HBIdentification } from "./jwt-types"
import { parseToken } from "./parse-token"

export function createTokenFactory(tokenSecret: string) {
  function encode<T extends string | object | Buffer>(payload: T) {
    return safer(() => jwt.sign(payload, tokenSecret))
  }

  return {
    createHBIdentification: (payload: HBIdentification) => encode(payload),
    parseHBIdentification: (token: string) => parseToken<HBIdentification>(token),
  }
}
