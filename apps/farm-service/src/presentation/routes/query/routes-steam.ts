import { ClerkExpressRequireAuth, type WithAuthProp } from "@clerk/clerk-sdk-node"
import { type Request, type Response, Router } from "express"
import { GetPersonaStateUseCase } from "~/application/use-cases/GetPersonaStateUseCase"

import z from "zod"
import { GetUserSteamGamesUseCase } from "~/application/use-cases/GetUserSteamGamesUseCase"
import { ListUserSteamAccountsUseCase } from "~/application/use-cases/ListUserSteamAccountsUseCase"
import { RefreshPersonaStateUseCase } from "~/application/use-cases/RefreshPersonaStateUseCase"
import { rateLimit } from "~/inline-middlewares/rate-limit"
import { ListSteamAccountsController, promiseHandler } from "~/presentation/controllers"
import { GetUserSteamGamesController } from "~/presentation/controllers/GetUserSteamGamesController"
import { RefreshGamesController } from "~/presentation/controllers/RefreshGamesController"
import {
  allUsersClientsStorage,
  steamAccountClientStateCacheRepository,
  usersDAO,
} from "~/presentation/instances"
import { RefreshGamesUseCase } from "~/presentation/presenters/RefreshGamesUseCase"

const refreshPersonaState = new RefreshPersonaStateUseCase(
  steamAccountClientStateCacheRepository,
  allUsersClientsStorage
)
const getPersonaState = new GetPersonaStateUseCase(
  steamAccountClientStateCacheRepository,
  refreshPersonaState
)

const listUserSteamAccounts = new ListUserSteamAccountsUseCase(usersDAO, getPersonaState)
const refreshGamesUseCase = new RefreshGamesUseCase(
  steamAccountClientStateCacheRepository,
  allUsersClientsStorage
)
const serSteamGamesUseCase = new GetUserSteamGamesUseCase(
  steamAccountClientStateCacheRepository,
  refreshGamesUseCase
)

export const query_routerSteam: Router = Router()

query_routerSteam.get(
  "/steam-accounts",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    if (!req.auth.userId) return res.status(400).json({ message: "Unauthorized!" })
    const listSteamAccountsController = new ListSteamAccountsController(listUserSteamAccounts)
    const { json, status } = await promiseHandler(
      listSteamAccountsController.handle({
        payload: {
          userId: req.auth.userId,
        },
      })
    )

    return res.status(status).json(json)
  }
)

query_routerSteam.get(
  "/games",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const [limited] = await rateLimit(req)
    if (limited) return res.status(limited.status).json(limited.json)

    if (!req.auth.userId) return res.status(400).json({ message: "Unauthorized!" })
    const query = z.object({ accountName: z.string() }).safeParse(req.query)
    if (!query.success) return res.status(400).json({ message: query.error })
    const { accountName } = query.data

    const getUserSteamGamesController = new GetUserSteamGamesController(serSteamGamesUseCase)
    const { json, status } = await promiseHandler(
      getUserSteamGamesController.handle({
        payload: {
          accountName,
          userId: req.auth.userId,
        },
      })
    )

    return res.status(status).json(json)
  }
)

query_routerSteam.get(
  "/refresh-games",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const [limited] = await rateLimit(req)
    if (limited) return res.status(limited.status).json(limited.json)

    if (!req.auth.userId) return res.status(400).json({ message: "Unauthorized!" })
    const query = z.object({ accountName: z.string() }).safeParse(req.query)
    if (!query.success) return res.status(400).json({ message: query.error })
    const { accountName } = query.data

    const refreshGamesController = new RefreshGamesController(refreshGamesUseCase)
    const { json, status } = await promiseHandler(
      refreshGamesController.handle({
        payload: {
          accountName,
          userId: req.auth.userId,
        },
      })
    )

    return res.status(status).json(json)
  }
)
