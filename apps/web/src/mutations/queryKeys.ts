export const ECacheKeys = {
  user_session: (userId: string) => ["me", userId],
  "USER-ADMIN-ITEM-LIST": ["USER-ADMIN-ITEM-LIST"],
  setGames: ["SET-GAMES"],
  setAccounts: ["SET-ACCOUNTS"],
  addHours: ["ADD-HOURS"],
  banUser: (userId: string) => ["BA N-USER", userId],
  unbanUser: (userId: string) => ["UNBAN-USER", userId],
}
