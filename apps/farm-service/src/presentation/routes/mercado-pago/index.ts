import "dotenv/config"

import { Router } from "express"

export const router: Router = Router()

export const loginErrorMessages: Record<number, string> = {
  5: "Invalid password or steam account.",
  18: "Account not found.",
  61: "Invalid Password",
  63:
    "Account login denied due to 2nd factor authentication failure. " +
    "If using email auth, an email has been sent.",
  65: "Account login denied due to auth code being invalid",
  66: "Account login denied due to 2nd factor auth failure and no mail has been sent",
  84: "Rate limit exceeded.",
}

// ============
export type UserID = string
export type LoginSessionID = string
export type LoginSessionConfig = {
  insertCodeCallback: ((code: string) => void) | null
}
