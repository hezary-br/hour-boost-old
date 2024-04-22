import type { HttpClient } from "core"
import { Router } from "express"
import { rateLimit } from "~/inline-middlewares/rate-limit"
import { promiseHandler } from "~/presentation/controllers/promiseHandler"
import { allUsersClientsStorage } from "~/presentation/instances"

export const query_routerGeneral: Router = Router()
query_routerGeneral.get("/up", (req, res) => {
  return res.status(200).json({
    message: "Server is up!",
  })
})

query_routerGeneral.get("/list", async (req, res) => {
  const [limited] = await rateLimit(req)
  if (limited) return res.status(limited.status).json(limited.json)

  return res.status(200).json({
    users: allUsersClientsStorage.listUsers(),
  })
})

query_routerGeneral.get("/farming-users", async (req, res) => {
  const perform = async () => {
    const json = allUsersClientsStorage.listUsers()

    return {
      status: 200,
      json,
    } as HttpClient.Response
  }

  const { status, json } = await promiseHandler(perform())
  return res.status(status).json(json)
})
