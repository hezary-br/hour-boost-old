import {
  ActiveStatus,
  BannedStatus,
  Fail,
  GuestPlan,
  PlanInfinity,
  PlanUsage,
  Purchase,
  Role,
  Status,
  SteamAccount,
  UsageList,
  UserRole,
} from "core/entity"
import { SteamAccountList } from "core/entity/SteamAccountList"
import { bad, nice } from "core/utils"

export class User {
  readonly id_user: string
  readonly email: string
  readonly username: string
  readonly profilePic: string
  readonly steamAccounts: SteamAccountList
  plan: PlanUsage | PlanInfinity
  readonly role: Role
  status: Status
  readonly purchases: Purchase[]
  readonly usages: UsageList

  private constructor(props: UserProps) {
    this.id_user = props.id_user
    this.email = props.email
    this.username = props.username
    this.profilePic = props.profilePic
    this.steamAccounts = props.steamAccounts
    this.plan = props.plan
    this.role = props.role
    this.status = props.status
    this.purchases = props.purchases
    this.usages = props.usages
  }

  static create(props: UserCreateProps) {
    return new User({
      ...props,
      profilePic: props.profilePic ?? "",
      plan: GuestPlan.create({
        ownerId: props.id_user,
      }),
      purchases: [],
      role: new UserRole(),
      status: new ActiveStatus(),
      steamAccounts: new SteamAccountList(),
      usages: new UsageList(),
    })
  }

  static restore(props: UserProps) {
    return new User(props)
  }

  assignPlan(plan: PlanUsage | PlanInfinity) {
    this.plan = plan
  }

  addSteamAccount(steamAccount: SteamAccount) {
    const currentUserSteamAccounts = this.steamAccounts.getAmount()
    const alreadyHasSteamAccountWithThisAccountName = this.steamAccounts.data.some(sa => {
      return sa.credentials.accountName === steamAccount.credentials.accountName
    })
    if (alreadyHasSteamAccountWithThisAccountName) {
      return bad(Fail.create("ALREADY_HAS_ACCOUNT_WITH_THIS_NAME", 403))
    }
    if (currentUserSteamAccounts >= this.plan.maxSteamAccounts) {
      return bad(Fail.create("ACCOUNTS_LIMIT_REACHED", 400))
    }
    this.steamAccounts.add(steamAccount)
    return nice()
  }

  ban() {
    this.status = new BannedStatus()
  }
}

type UserProps = {
  id_user: string
  email: string
  username: string
  profilePic: string
  steamAccounts: SteamAccountList
  plan: PlanUsage | PlanInfinity
  role: Role
  status: Status
  purchases: Purchase[]
  usages: UsageList
}

type UserCreateProps = {
  id_user: string
  email: string
  username: string
  profilePic?: string
}
