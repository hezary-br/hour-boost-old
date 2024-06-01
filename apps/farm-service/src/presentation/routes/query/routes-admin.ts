import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { Router } from "express"
import { z } from "zod"
import { AddMoreGamesToPlanUseCase } from "~/application/use-cases/AddMoreGamesToPlanUseCase"
import { GetUsersAdminListUseCase } from "~/application/use-cases/GetUsersAdminListUseCase"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { GENERIC_ERROR_JSON, GENERIC_ERROR_STATUS } from "~/consts"
import { ensureAdmin } from "~/inline-middlewares/ensureAdmin"
import { validateBody } from "~/inline-middlewares/validate-payload"
import {
  addUsageTimeToPlanUseCase,
  banUserUseCase,
  changeUserPlanUseCase,
  flushUpdateSteamAccountDomain,
  setMaxSteamAccountsUseCase,
  steamAccountClientStateCacheRepository,
  unbanUserUseCase,
  usersDAO,
  usersRepository,
} from "~/presentation/instances"

export const query_routerAdmin: Router = Router()

const getUsersAdminListUseCase = new GetUsersAdminListUseCase(usersDAO)
query_routerAdmin.get("/users-list", async (req, res) => {
  const [noAdminRole] = await ensureAdmin(req, res)
  if (noAdminRole) return res.status(noAdminRole.status).json(noAdminRole.json)

  const [error, usersAdminList] = await getUsersAdminListUseCase.execute({})

  return res.json({ usersAdminList, code: "SUCCESS" })
})

const addMoreGamesToPlanUseCase = new AddMoreGamesToPlanUseCase(
  usersRepository,
  flushUpdateSteamAccountDomain,
  steamAccountClientStateCacheRepository
)

query_routerAdmin.post("/add-more-games", async (req, res) => {
  const [noAdminRole] = await ensureAdmin(req, res)
  if (noAdminRole) return res.status(noAdminRole.status).json(noAdminRole.json)

  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      newMaxGamesAllowed: z.number().positive(),
      mutatingUserId: z.string().min(1),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { newMaxGamesAllowed, mutatingUserId } = body

  const [error, usersAdminList] = await addMoreGamesToPlanUseCase.execute({
    newMaxGamesAllowed,
    mutatingUserId,
  })

  if (error) {
    if ("code" in error) {
      switch (error.code) {
        case "USER-NOT-FOUND":
          return console.log({ error })
        case "LIST::COULD-NOT-RESET-FARM":
          return console.log(error.payload)
        default:
          error satisfies never
      }
    }
    error satisfies never
  }

  return res.json({ usersAdminList, code: "SUCCESS" })
})

query_routerAdmin.post("/set-max-steam-accounts", async (req, res) => {
  const [noAdminRole] = await ensureAdmin(req, res)
  if (noAdminRole) return res.status(noAdminRole.status).json(noAdminRole.json)

  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      newMaxSteamAccountsAllowed: z.number().min(1),
      mutatingUserId: z.string().min(1),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { newMaxSteamAccountsAllowed, mutatingUserId } = body

  const [error, user] = await setMaxSteamAccountsUseCase.execute({
    newMaxSteamAccountsAllowed,
    mutatingUserId,
  })

  if (error) {
    if ("code" in error) {
      switch (error.code) {
        case "USER-NOT-FOUND":
          return console.log({ error })
        case "LIST::TRIMMING-ACCOUNTS":
        case "LIST::COULD-NOT-RESET-FARM":
          return console.log(error.payload)
        default:
          error satisfies never
      }
    }
    error satisfies never
  }

  return res.json({ user, code: "SUCCESS" })
})

query_routerAdmin.post("/add-usage", async (req, res) => {
  const [noAdminRole] = await ensureAdmin(req, res)
  if (noAdminRole) return res.status(noAdminRole.status).json(noAdminRole.json)

  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      usageTimeInSeconds: z.number().min(1),
      mutatingUserId: z.string().min(1),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { mutatingUserId, usageTimeInSeconds } = body

  const [error] = await addUsageTimeToPlanUseCase.execute({
    mutatingUserId,
    usageTimeInSeconds,
  })

  if (error) {
    if ("code" in error) {
      switch (error.code) {
        case "USER-NOT-FOUND":
          return console.log({ error })
        case "PLAN-IS-INFINITY":
          return res
            .status(400)
            .json({ code: error.code, message: "Operação inválida! Plano é do tipo Infinity." })
        case "LIST::COULD-NOT-RESET-FARM":
          return console.log(error.payload)
        default:
          error satisfies never
      }
    }
    error satisfies never
  }

  return res.json({ code: "SUCCESS" })
})

query_routerAdmin.post("/ban-user", ClerkExpressRequireAuth(), async (req, res) => {
  const [noAdminRole] = await ensureAdmin(req, res)
  if (noAdminRole) return res.status(noAdminRole.status).json(noAdminRole.json)

  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      banningUserId: z.string().min(1),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { banningUserId } = body

  if (req.auth.userId === banningUserId) {
    return res.status(403).json({
      message: "Você não pode banir a sí mesmo.",
    })
  }
  const [error] = await banUserUseCase.execute(banningUserId)

  if (error) {
    switch (error.code) {
      case "USER-NOT-FOUND":
        return res.status(error.httpStatus).json({ code: error.code, message: "Usuário não encontrado." })
      case "LIST::REMOVING-ACCOUNTS":
      case "LIST::PERSISTING-USAGES":
      case "ERROR-GETTING-LAST-SUBSCRIPTION":
      case "FAILED-TO-CANCEL-STRIPE-SUBSCRIPTION":
      case "STRIPE-CUSTOMER-NOT-FOUND":
        // case "COULD-NOT-PERSIST-ACCOUNT-USAGE":
        // case "LIST::COULD-NOT-RESET-FARM":
        // case "LIST::TRIMMING-ACCOUNTS":
        // case "LIST::UPDATING-CACHE":
        // case "PLAN-NOT-FOUND":
        console.log("ERROR: ", error.code, error.payload)
        return res.status(GENERIC_ERROR_STATUS).json(GENERIC_ERROR_JSON)
      default:
        error satisfies never
    }
  }

  return res.json({ code: "SUCCESS" })
})

query_routerAdmin.post("/unban-user", async (req, res) => {
  const [noAdminRole] = await ensureAdmin(req, res)
  if (noAdminRole) return res.status(noAdminRole.status).json(noAdminRole.json)

  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      unbanningUserId: z.string().min(1),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { unbanningUserId } = body

  const [error] = await unbanUserUseCase.execute(unbanningUserId)

  if (error) {
    switch (error.code) {
      case "USER-NOT-FOUND":
        return res.status(error.httpStatus).json({ code: error.code, message: "Usuário não encontrado." })
      default:
        error.code satisfies never
    }
  }

  return res.json({ code: "SUCCESS" })
})

query_routerAdmin.post("/change-user-plan", async (req, res) => {
  const [_, isAdmin] = await ensureAdmin(req, res)
  console.log({ secret: req.body, env: process.env.ACTIONS_SECRET })
  const authorized = isAdmin || req.body.secret === process.env.ACTIONS_SECRET
  if (!authorized) {
    return res.status(500).json({ message: "Unauthorized. :)" })
  }

  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      newPlanName: z.enum(["DIAMOND", "GOLD", "GUEST", "SILVER"]),
      userId: z.string().min(1),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { newPlanName, userId } = body

  const [errorGettingUser, user] = await getUser(usersRepository, userId)
  if (errorGettingUser) {
    return res
      .status(errorGettingUser.httpStatus)
      .json({ code: errorGettingUser.code, message: "Usuário não encontrado." })
  }
  const [error] = await changeUserPlanUseCase.execute_creatingByPlanName({
    newPlanName,
    user: user!,
  })

  if (error) {
    console.log(error)
    switch (error.code) {
      case "LIST::TRIMMING-ACCOUNTS":
      case "LIST::UPDATING-CACHE":
      case "LIST::COULD-NOT-RESET-FARM":
        console.log("ERROR: ", error.code, error.payload)
      case "COULD-NOT-PERSIST-ACCOUNT-USAGE":
        return res.status(GENERIC_ERROR_STATUS).json(GENERIC_ERROR_JSON)
      default:
        error satisfies never
    }
  }

  return res.status(200).json({ code: "SUCCESS" })
})
