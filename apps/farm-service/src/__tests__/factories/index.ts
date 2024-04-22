import type { SteamAccountCredentials, User } from "core"
import { SteamAccountClient, SteamAccountClientProps } from "~/application/services/steam"
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

type SACProps = Partial<Omit<SteamAccountClientProps["props"], "accountName">>

export function makeSACFactoryOptional(validSteamAccounts: SteamAccountCredentials[], publisher: Publisher) {
  function sacFactory(user: User, accountName: string, props = {} as SACProps) {
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
        ...props,
      },
    })
  }
  return sacFactory
}
