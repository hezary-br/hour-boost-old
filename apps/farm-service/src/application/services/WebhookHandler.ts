import { Fail, User } from "core"
import { ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { RollbackToGuestPlanUseCase } from "~/application/use-cases/RollbackToGuestPlanUseCase"
import { assertNever } from "~/utils/assertNever"
import { bad, nice } from "~/utils/helpers"

export class WebhookHandler {
  constructor(private readonly rollbackToGuestPlanUseCase: RollbackToGuestPlanUseCase) {}

  private async cancel({ user }: { user: User }) {
    const currentPlanIsGuest = user.plan.name === "GUEST"
    if (currentPlanIsGuest) return bad(Fail.create("USER-PLAN-IS-ALREADY-GUEST", 400))
    const [failRollingBack] = await this.rollbackToGuestPlanUseCase.execute({ user })
    if (failRollingBack) {
      ctxLog(`NSTH: Fail while rolling back from [${user.plan.name}] to guest plan GUEST.`, {
        failRollingBack,
      })
    }
    ctxLog(`Success: Rolled back plan from [${user.plan.name}] to GUEST`)
    return nice()
  }

  async execute(event: WebhookEvent, user: User) {
    if (event.type === "cancellation") return await this.cancel({ user })
    if (event.type === "unknown") return bad(Fail.create("UNHANDLED-EVENT", 400))
    assertNever(event.type)
  }
}

export class WebhookEvent {
  constructor(readonly type: "cancellation" | "unknown") {}
}
