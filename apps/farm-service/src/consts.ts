import { AccountGames } from "core"
import SteamUser from "steam-user"

export const EVENT_PROMISES_TIMEOUT_IN_SECONDS = 30

// export const AUTO_RESTARTER_INTERVAL_IN_SECONDS = 15
export const AUTO_RESTARTER_INTERVAL_IN_SECONDS = 60 * 5

export const CLIENT_ERRORS_THAT_SHOULD_SCHEDULE_AUTO_RESTARTER: SteamUser.EResult[] = [
  SteamUser.EResult.LoggedInElsewhere,
]

export const getHeaderImageByGameId = (gameId: number) =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/header.jpg?t=${gameId}`

export const allAccountGames: Record<string, AccountGames> = {
  paco: {
    app_count: 2,
    apps: [
      { appid: 730, img_icon_url: "" },
      { appid: 489520, img_icon_url: "" },
    ],
  },
  fred: {
    app_count: 0,
    apps: [],
  },
  bane: {
    app_count: 1,
    apps: [{ appid: 601510, img_icon_url: "" }],
  },
}
