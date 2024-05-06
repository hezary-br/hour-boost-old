export type PlanPayloadJSON = {
  planName: string
  userId: string
}

export class PlanPayload {
  static serialize(props: PlanPayloadJSON) {
    return JSON.stringify(props)
  }

  static parse(props: string) {
    return JSON.parse(props) as PlanPayloadJSON
  }
}
