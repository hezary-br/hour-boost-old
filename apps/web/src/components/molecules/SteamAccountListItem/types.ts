import { IntentionCodes } from "@/components/molecules/FarmGames/types"
import { DataOrMessage, Message } from "@/util/DataOrMessage"
import { GameSession, SteamAccountSession } from "core"

export type SteamAccountStatusLiveProps = {
  autoRestarter?: boolean
  steamGuard?: boolean
  farmingTime: number
}

export type SteamAccountStatusProps = {
  header?: boolean
  maxGamesAllowed: number
}

export type SteamAccountAppProps = SteamAccountSession

export type SteamAccountListItemViewProps = {
  handleClickFarmButton(): Promise<NSSteamAccountListItemViewProps.HandleClickFarmButton.Response>
  actionText: JSX.Element
}

export namespace NSSteamAccountListItemViewProps {
  export namespace HandleClickFarmButton {
    export type Payload = {
      list: number[]
      games: GameSession[]
    }
    export type Response = DataOrMessage<Payload | Message, IntentionCodes>
  }
}
