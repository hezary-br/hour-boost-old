import { PlanAllNames, PlanInfinityName } from "core"

export type PlanPayloadJSON = {
  planName: PlanInfinityName
  userId: string
  userEmail: string
}

export class PlanPayload {
  static serialize(props: PlanPayloadJSON) {
    return JSON.stringify(props)
  }

  static parse(props: string) {
    return JSON.parse(props) as PlanPayloadJSON
  }
}
