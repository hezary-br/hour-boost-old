import { randomUUID } from "node:crypto"

export function makeID() {
  return randomUUID()
}
