import { ClerkExpressRequireAuth, type WithAuthProp } from "@clerk/clerk-sdk-node"
import { AddSteamAccount, ApplicationError, type HttpClient, appAccountStatusSchema } from "core"
import { type Request, type Response, Router } from "express"
import { z } from "zod"
import { ChangeAccountStatusUseCase, UpdateStagingGamesUseCase } from "~/application/use-cases"
import { StopAllFarms } from "~/application/use-cases/StopAllFarms"
import { ToggleAutoReloginUseCase } from "~/application/use-cases/ToggleAutoReloginUseCase"
import { GENERIC_ERROR_JSON, GENERIC_ERROR_STATUS } from "~/consts"

import {
  AddSteamAccountController,
  FarmGamesController,
  StopAllFarmsController,
  StopFarmController,
} from "~/presentation/controllers"
import { RemoveSteamAccountControllerController } from "~/presentation/controllers/RemoveSteamAccountController"
import { ToggleAutoReloginController } from "~/presentation/controllers/ToggleAutoReloginController"
import { UpdateStagingGamesController } from "~/presentation/controllers/UpdateStagingGamesController"
import { promiseHandler, promiseHandlerBroad } from "~/presentation/controllers/promiseHandler"
import {
  addSteamAccountUseCase,
  addSteamGuardCodeController,
  allUsersClientsStorage,
  farmGamesUseCase,
  hashService,
  idGenerator,
  planRepository,
  removeSteamAccountUseCase,
  stagingGamesListService,
  steamAccountClientStateCacheRepository,
  steamAccountsRepository,
  stopFarmUseCase,
  usersClusterStorage,
  usersDAO,
  usersRepository,
} from "~/presentation/instances"

export const addSteamAccount = new AddSteamAccount(usersRepository, idGenerator)
const stopAllFarmsUseCase = new StopAllFarms(usersClusterStorage)
export const command_routerSteam: Router = Router()

type Resolved = {
  message: string
} & Record<string, any>

command_routerSteam.post(
  "/steam-accounts",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const addSteamAccountController = new AddSteamAccountController(addSteamAccountUseCase)

    const { json, status } = await promiseHandler(
      addSteamAccountController.handle({
        payload: {
          accountName: req.body.accountName,
          password: req.body.password,
          userId: req.auth.userId!,
          authCode: req.body.authCode,
        },
      })
    )

    return res.status(status).json(json)
  }
)

command_routerSteam.delete(
  "/steam-accounts",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const removeSteamAccountControllerController = new RemoveSteamAccountControllerController(
      removeSteamAccountUseCase
    )

    const { status, json } = await promiseHandler(
      removeSteamAccountControllerController.handle({
        payload: {
          accountName: req.body.accountName,
          steamAccountId: req.body.steamAccountId,
          userId: req.auth.userId!,
          username: req.body.username,
        },
      })
    )
    return res.status(status).json(json)
  }
)

command_routerSteam.post(
  "/farm/start",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const startFarmController = new FarmGamesController({
      allUsersClientsStorage,
      farmGamesUseCase,
      usersRepository,
      hashService,
    })
    const { json, status } = await promiseHandler(
      startFarmController.handle({
        payload: {
          accountName: req.body.accountName,
          gamesID: req.body.gamesID,
          userId: req.auth.userId!,
        },
      })
    )

    return json ? res.status(status).json(json) : res.status(status).end()
  }
)

const updateStagingGamesUseCase = new UpdateStagingGamesUseCase(
  stagingGamesListService,
  usersClusterStorage,
  usersRepository,
  steamAccountClientStateCacheRepository,
  allUsersClientsStorage
)

command_routerSteam.put(
  "/farm/staging/list",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const updateStagingGamesController = new UpdateStagingGamesController(updateStagingGamesUseCase)
    const { code, json, status } = await promiseHandlerBroad(
      updateStagingGamesController.handle({
        accountName: req.body.accountName,
        newGameList: req.body.newGameList,
        userId: req.auth.userId!,
      })
    )

    if (code !== "SUCCESS") {
      console.log(`[${code}] Attempt to PATCH "/farm/staging/list" with`, {
        newGameList: req.body.newGameList,
        accountName: req.body.accountName,
        userId: req.auth.userId!,
      })
    }

    return json ? res.status(status).json({ ...json, code }) : res.status(status).end()
  }
)

command_routerSteam.post(
  "/farm/stop",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const perform = async () => {
      const { accountName } = req.body

      const stopFarmController = new StopFarmController(stopFarmUseCase, usersRepository)
      return await stopFarmController.handle({
        payload: {
          userId: req.auth.userId!,
          accountName,
        },
      })
    }

    const { status, json } = await promiseHandler(perform())
    return json ? res.status(status).json(json) : res.status(status).end()
  }
)

command_routerSteam.post("/code", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { status, json, headers, cookies } = await addSteamGuardCodeController.handle({
      accountName: req.body.accountName,
      code: req.body.code,
      userId: req.auth.userId!,
    })

    headers?.forEach(header => {
      res.setHeader(header.name, header.value)
    })

    cookies?.forEach(cookie => {
      res.cookie(cookie.name, cookie.value, cookie.options)
    })

    res.statusCode = status
    return json ? res.json(json) : res.end()
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Erro interno.",
    })
  }
})

command_routerSteam.post("/farm/stop/all", async (req, res) => {
  const { secret } = req.body
  const stopAllFarmsController = new StopAllFarmsController(stopAllFarmsUseCase)
  const { json, status } = await promiseHandler(
    stopAllFarmsController.handle({
      payload: {
        secret,
      },
    })
  )

  return json ? res.status(status).json(json) : res.status(status).end()
})

command_routerSteam.patch(
  "/account/status",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const perform = (async () => {
      const validation = z
        .object({ accountName: z.string().min(1), status: appAccountStatusSchema })
        .safeParse(req.body)
      if (!validation.success)
        return Promise.resolve({
          status: 400,
          json: {
            issues: validation.error.issues,
            code: "ERROR_ValidatingRequestBody",
            validationMessage: validation.error.message,
            message: "Validação falhou.",
          },
        } satisfies HttpClient.Response<any>)

      const { accountName, status } = validation.data
      const changeAccountStatusUseCase = new ChangeAccountStatusUseCase(
        allUsersClientsStorage,
        steamAccountClientStateCacheRepository
      )
      const [error] = await changeAccountStatusUseCase.execute({
        accountName,
        status,
        userId: req.auth.userId!,
      })
      if (error) {
        if (error instanceof ApplicationError) {
          return {
            status: error.status,
            json: {
              code: "ERROR_ChangeAccountStatusUseCase",
              message: error.message,
            },
          }
        }
        if (error.code === "SAC-IS-REQUIRING-STEAM-GUARD") {
          return {
            status: error.httpStatus,
            json: {
              code: error.code,
              message: "Você precisa informar o Steam Guard primeiro.",
            },
          }
        }
        return {
          status: GENERIC_ERROR_STATUS,
          json: GENERIC_ERROR_JSON,
        }
      }
      return Promise.resolve({
        status: 200,
        json: {
          message: `Status mudado para: ${status}.` as const,
          code: "SUCCESS",
        },
      })
      // })
    }) satisfies () => Promise<HttpClient.Response<any>>

    const { status, json } = await promiseHandler(perform())
    // const { status, json } = await promiseHandler(perform())
    return json ? res.status(status).json(json) : res.status(status).end()
  }
)

const toggleAutoReloginUseCase = new ToggleAutoReloginUseCase(
  allUsersClientsStorage,
  planRepository,
  steamAccountsRepository,
  usersDAO
)

command_routerSteam.patch(
  "/account/auto-relogin",
  ClerkExpressRequireAuth(),
  async (req: WithAuthProp<Request>, res: Response) => {
    const toggleAutoReloginController = new ToggleAutoReloginController(toggleAutoReloginUseCase)

    const inputValidation = z
      .object({
        accountName: z.string().min(1),
      })
      .safeParse(req.body)

    if (!inputValidation.success) {
      return res.status(400).json({
        issues: inputValidation.error.issues,
        code: "ERROR_ValidatingRequestBody",
        validationMessage: inputValidation.error.message,
        message: "Validação falhou.",
      })
    }

    const { accountName } = inputValidation.data

    const { code, json, status } = await toggleAutoReloginController.handle({
      accountName,
      userId: req.auth.userId!,
    })

    if (code !== "SUCCESS") {
      console.log(`[${code}] Attempt to PATCH "/account/auto-relogin" with`, {
        accountName,
        userId: req.auth.userId!,
      })
    }

    // const { status, json } = await promiseHandler(perform())
    return json ? res.status(status).json(json) : res.status(status).end()
  }
)
