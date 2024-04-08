import { safer } from "@hourboost/utils"
import { DataOrFail, bad, nice } from "core"
import jwt from "jsonwebtoken"

export function parseToken<T extends jwt.JwtPayload>(token: string): DataOrFail<Error, T> {
  const [error, decodedToken] = safer<T | string | null | jwt.JwtPayload>(() => jwt.decode(token))
  if (error) return bad(error)
  const [errorParsingToken, finalToken] = ensureTokenObjectFormat<T>(decodedToken)
  if (errorParsingToken) return bad(errorParsingToken)
  return nice(finalToken)
}

function ensureTokenObjectFormat<T extends jwt.JwtPayload>(
  tokenUnknownFormat: string | null | jwt.JwtPayload | T
) {
  if (typeof tokenUnknownFormat === "string" || tokenUnknownFormat === null) {
    return bad(new Error("Token in bad format."))
  }
  return nice(tokenUnknownFormat as T)
}
