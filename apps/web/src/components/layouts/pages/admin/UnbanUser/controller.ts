export type UserAdminActionUnbanUserPayload = UserAdminActionUnbanUserPayloadAditional & {
  unbanningUserId: string
}

export type UserAdminActionUnbanUserPayloadAditional = {
  username: string
}
