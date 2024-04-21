import type { SteamAccountCredentials, User } from "core"
import { SteamAccountClient } from "~/application/services/steam"
import type { Publisher } from "~/infra/queue"
import { EventEmitterBuilder, SteamUserMockBuilder } from "~/utils/builders"

export function makeSACFactory(validSteamAccounts: SteamAccountCredentials[], publisher: Publisher) {
  function sacFactory(user: User, accountName: string) {
    return new SteamAccountClient({
      instances: {
        emitter: new EventEmitterBuilder().create(),
        publisher,
      },
      props: {
        accountName,
        client: new SteamUserMockBuilder(validSteamAccounts).create(),
        userId: user.id_user,
        username: user.username,
        planId: user.plan.id_plan,
        autoRestart: false,
        isRequiringSteamGuard: false,
      },
    })
  }
  return sacFactory
}
