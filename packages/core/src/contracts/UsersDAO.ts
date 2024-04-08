import { PlanInfinity, PlanUsage } from "core/entity"
import { Role, UserAdminPanelSession } from ".."
import { UserSession, UserSessionShallow } from "../presenters/user-presenter"

export interface UsersDAO {
  getUsersSteamAccounts(userId: string): Promise<DatabaseSteamAccount[]>
  getByID(userId: string): Promise<UserSession | null>
  getByIDShallow(userId: string): Promise<UserSessionShallow | null>
  getUsername(userId: string): Promise<{ username: string } | null>
  getPlanId(userId: string): Promise<string | null>
  getUserInfoById(
    userId: string
  ): Promise<{ username: string; userId: string; plan: PlanUsage | PlanInfinity } | null>
  getUsersAdminList(): Promise<UserAdminPanelSession[]>
  getRoleByUserId(userId: string): Promise<Role | null>
}

export namespace NSUsersDAO {
  export type GetByIdFilter = Partial<{
    plan: Partial<{
      id_plan: boolean
    }>
    username: boolean
  }>
}

export interface DatabaseSteamAccount {
  id_steamAccount: string
  accountName: string
  userId: string
}
