import { SteamAccountClient } from "~/application/services/steam"
import type { Publisher } from "~/infra/queue"
import type { EventEmitterBuilder } from "~/utils/builders"
import type { Builder, SteamClientBuilder } from "~/utils/builders/builder.interface"

export class SteamAccountClientBuilder implements Builder<SteamAccountClient> {
  constructor(
    private readonly emitterBuilder: EventEmitterBuilder,
    private readonly publisher: Publisher,
    private readonly steamUserBuilder: SteamClientBuilder
  ) {}

  create({
    accountName,
    userId,
    username,
    planId,
    autoRestart,
    isRequiringSteamGuard,
  }: CreateSteamAccountClient): SteamAccountClient {
    return new SteamAccountClient({
      instances: {
        emitter: this.emitterBuilder.create(),
        publisher: this.publisher,
      },
      props: {
        accountName,
        client: this.steamUserBuilder.create(),
        userId,
        username,
        planId,
        autoRestart,
        isRequiringSteamGuard,
      },
    })
  }
}

type CreateSteamAccountClient = {
  accountName: string
  userId: string
  username: string
  planId: string
  autoRestart: boolean
  isRequiringSteamGuard: boolean
}
