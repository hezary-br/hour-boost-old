export type UserAdminActionBanUserPayload = UserAdminActionBanUserPayloadAditional & {
  banningUserId: string
}

type UserAdminActionBanUserPayloadAditional = {
  username: string
}
