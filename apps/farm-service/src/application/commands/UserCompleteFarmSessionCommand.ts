import type { Command } from "~/application/commands"
import type { FarmSession } from "~/application/services"
import type { EventNames } from "~/infra/queue"

export class UserCompleteFarmSessionCommand implements Command {
  operation: EventNames = "user-complete-farm-session"
  when: Date
  planId: string
  farmSession: FarmSession
  isFinalizingSession: boolean
  userId: string

  constructor(props: UserCompleteFarmSessionCommandProps) {
    this.when = props.when
    this.planId = props.planId
    this.farmSession = props.farmSession
    this.isFinalizingSession = props.isFinalizingSession
    this.userId = props.userId
  }
}

interface UserCompleteFarmSessionCommandProps {
  when: Date
  planId: string
  farmSession: FarmSession
  isFinalizingSession: boolean
  userId: string
}
