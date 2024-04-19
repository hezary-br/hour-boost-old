import { PlanAllNames } from "core"

export type UserAdminActionChangeUserPlanPayloadAll = UserAdminActionChangeUserPlanPayloadAditional &
  UserAdminActionChangeUserPlanPayload

export type UserAdminActionChangeUserPlanPayload = {
  newPlanName: string
  userId: string
}

type UserAdminActionChangeUserPlanPayloadAditional = {
  username: string
  newPlanValue: PlanAllNames
}
