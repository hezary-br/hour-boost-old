import { Router } from "express"
import { z } from "zod"
import { AddMoreGamesToPlanUseCase } from "~/application/use-cases/AddMoreGamesToPlanUseCase"
import { GetUsersAdminListUseCase } from "~/application/use-cases/GetUsersAdminListUseCase"
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

  const [error, usersAdminList] = await setMaxSteamAccountsUseCase.execute({
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

  return res.json({ usersAdminList, code: "SUCCESS" })
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

query_routerAdmin.post("/ban-user", async (req, res) => {
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

  const [error] = await banUserUseCase.execute(banningUserId)

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
  const { secret } = req.body
  if (secret !== process.env.ACTIONS_SECRET) {
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

  const user = await usersRepository.getByID(userId)
  const [error] = await changeUserPlanUseCase.execute({
    newPlanName,
    user: user!,
  })

  return res.status(200).json(error ?? "sucesso")
})
