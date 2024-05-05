import "dotenv/config"

import { ClerkExpressWithAuth, type WithAuthProp } from "@clerk/clerk-sdk-node"
import { GetUser } from "core"

import { HBHeaders } from "@hourboost/tokens"
import { Router, type Request, type Response } from "express"
import { CreateUserUseCase } from "~/application/use-cases"
import { token } from "~/infra/singletons/token-factory"
import { GetMeController } from "~/presentation/controllers"
import {
  createMeController,
  tokenService,
  userAuthentication,
  usersClusterStorage,
  usersDAO,
  usersRepository,
} from "~/presentation/instances"

export const query_routerUser: Router = Router()
export const createUser = new CreateUserUseCase(usersRepository, userAuthentication, usersClusterStorage)
export const getUser = new GetUser(usersDAO)

query_routerUser.head("/me", ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId
  if (!userId) {
    return res.setHeader(HBHeaders["hb-has-id"], "false").end()
  }

  const user = await usersDAO.getByIDShallow(userId)
  if (!user) {
    res.setHeader(HBHeaders["hb-has-id"], "false")
    res.setHeader(HBHeaders["hb-has-user"], "false")
    return res.end()
  }

  const [errorSigningToken, userToken] = token.createHBIdentification({
    role: user.role,
    userId,
    status: user.status,
    planName: user.plan.name,
  })
  if (errorSigningToken) {
    return res.status(400).end()
  }

  res.header(HBHeaders["hb-has-id"], "true")
  res.header(HBHeaders["hb-has-user"], "true")
  res.header(HBHeaders["hb-identification"], userToken)
  return res.end()
})

query_routerUser.get("/me", ClerkExpressWithAuth({}), async (req: WithAuthProp<Request>, res: Response) => {
  const userId = req.auth.userId
  const getMeController = new GetMeController(usersRepository, createUser, usersDAO, tokenService)
  const [error, me] = await getMeController.handle({
    userId,
  })

  if (error) {
    switch (error.code) {
      case "USER-SESSION-NOT-FOUND":
        return res.status(404).json({
          message: `Não foi possível encontrar uma sessão de usuário para usuário com ID [${error.payload.userId}]`,
        })
      case "ERROR":
      case "ERROR-SIGNING-IDENTIFICATION-TOKEN":
        return res.status(500).json({
          message: `Aconteceu um erro ao pegar dados do usuário de ID [${userId}]`,
          errorCode: error.code,
        })
      default:
        error satisfies never
    }
    error satisfies never
    throw new Error("Something wrong with types.")
  }

  if (me.code === "NO-USER-ID-PROVIDED") {
    return res.status(200).json({
      message: "Nenhum ID de usuário informado, retornando sessão nula.",
      userSession: null,
      code: me.code,
    })
  }

  const json = {
    code: me.code,
    userSession: me.userSession,
  }
  return res.status(200).json(json)
})

query_routerUser.post(
  "/create-me",
  ClerkExpressWithAuth({}),
  async (req: WithAuthProp<Request>, res: Response) => {
    const userId = req.auth.userId
    const { status, json, headers, cookies } = await createMeController.handle({
      userId,
    })

    headers?.forEach(header => {
      res.setHeader(header.name, header.value)
    })

    cookies?.forEach(cookie => {
      res.cookie(cookie.name, cookie.value, cookie.options)
    })

    res.statusCode = status
    debugger
    return json ? res.json(json) : res.end()
  }
)
