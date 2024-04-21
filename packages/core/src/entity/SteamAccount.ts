import { IDGenerator } from "../contracts"
import { SteamAccountCredentials } from "./SteamAccountCredentials"

export class SteamAccount {
  id_steamAccount: string
  credentials: SteamAccountCredentials
  ownerId: string | null
  autoRelogin: boolean
  isRequiringSteamGuard: boolean

  private constructor(props: SteamAccountProps) {
    this.id_steamAccount = props.id_steamAccount
    this.credentials = props.credentials
    this.ownerId = props.ownerId
    this.autoRelogin = props.autoRelogin
    this.isRequiringSteamGuard = props.isRequiringSteamGuard
  }

  static create(props: SteamAccountCreateProps) {
    return new SteamAccount({
      ...props,
      id_steamAccount: props.idGenerator.makeID(),
      autoRelogin: false,
      isRequiringSteamGuard: false,
    })
  }

  static restore(props: SteamAccountProps) {
    return new SteamAccount(props)
  }

  disown() {
    this.ownerId = null
  }

  toggleAutoRelogin() {
    this.autoRelogin = !this.autoRelogin
  }
}

type SteamAccountProps = {
  id_steamAccount: string
  credentials: SteamAccountCredentials
  ownerId: string | null
  autoRelogin: boolean
  isRequiringSteamGuard: boolean
}

type SteamAccountCreateProps = {
  credentials: SteamAccountCredentials
  idGenerator: IDGenerator
  ownerId: string | null
}
