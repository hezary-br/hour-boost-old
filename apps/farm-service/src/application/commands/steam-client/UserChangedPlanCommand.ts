import { User } from "core"
import type { Command } from "~/application/commands/Command"
import type { EventNames } from "~/infra/queue"

interface UserChangedPlanCommandProps {
  when: Date
  user: User
}

export class UserChangedPlanCommand implements Command {
  operation: EventNames = "user-changed-plan"
  when: Date
  user: User

  constructor(props: UserChangedPlanCommandProps) {
    this.when = props.when
    this.user = props.user
  }
}
