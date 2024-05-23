export const ECacheKeys = {
  user_session: (userId: string | null | undefined) => ["me", userId],
  "USER-ADMIN-ITEM-LIST": ["USER-ADMIN-ITEM-LIST"],
  setGames: ["SET-GAMES"],
  setAccounts: ["SET-ACCOUNTS"],
  addHours: ["ADD-HOURS"],
  banUser: (userId: string) => ["BAN-USER", userId],
  unbanUser: (userId: string) => ["UNBAN-USER", userId],
  preAprovalPlan: (planName?: string, userId?: string) => ["PRE-APPROVAL-PLAN", planName, userId],
  changeUserPlan: (userId: string) => ["CHANGE-USER-PLAN", userId],
  addSteamGuard: (accountName: string) => ["ADD-STEAM-GUARD", accountName],
}
