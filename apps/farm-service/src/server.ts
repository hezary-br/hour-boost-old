import type { LooseAuthProp } from "@clerk/clerk-sdk-node"
import prefix from "console-stamp"
import cookieParser from "cookie-parser"
import cors from "cors"
import "dotenv/config"
import type { Application, NextFunction, Request, Response } from "express"
import express from "express"
import "express-async-errors"
import "~/application/handlers"
import { RestoreAccountManySessionsUseCase } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { RestoreUsersSessionsUseCase } from "~/application/use-cases/RestoreUsersSessionsUseCase"
import { __recoveringAccounts } from "~/momentarily"
import {
  autoRestartCron,
  steamAccountsDAO,
  usersClusterStorage,
  usersRepository,
} from "~/presentation/instances"
import { command_routerSteam } from "~/presentation/routes/command"
import { command_routerPlan } from "~/presentation/routes/command/routes-plan"
import {
  query_routerGeneral,
  query_routerPlan,
  query_routerSteam,
  query_routerUser,
} from "~/presentation/routes/query"
import { query_routerAdmin } from "~/presentation/routes/query/routes-admin"
import { env } from "./env"

prefix(console, {
  format: ":date(yyyy/mm/dd HH:MM:ss.l)",
})

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}

const app: Application = express()
app.use(
  cors({
    origin: env.CLIENT_URL,
  })
)

app.use(express.json())
app.use(cookieParser())

app.use(query_routerUser)
app.use("/admin", query_routerAdmin)
app.use(query_routerSteam)
app.use(query_routerPlan)
app.use(query_routerGeneral)
app.use(command_routerSteam)
app.use(command_routerPlan)

app.get("/recovering-accounts", (req, res) => {
  res.json({
    __recoveringAccounts: Array.from(__recoveringAccounts),
  })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.log(err)
    return res.status(504).json({
      message: "Something went wrong.",
      err,
    })
  }
  next()
})

const restoreUsersSessionsUseCase = new RestoreUsersSessionsUseCase(usersClusterStorage)
const restoreAccountManySessionsUseCase = new RestoreAccountManySessionsUseCase(
  steamAccountsDAO,
  autoRestartCron
)

async function main() {
  // if (env.NODE_ENV !== "PRODUCTION") {
  //   const is = await isProductionServerOn()
  //   if (is) throw new Error("PROD SERVER ON")
  // }

  const users = await usersRepository.findMany()
  restoreUsersSessionsUseCase.execute({ users })
  await restoreAccountManySessionsUseCase.execute({
    batchOptions: {
      batchAmount: 5,
      noiseInSeconds: 10,
      intervalInSeconds: 60, // 1 minuto
    },
  })
  // await restoreAccountManySessionsUseCase.execute({
  //   whitelistAccountNames: ["soulfault"],
  // })
}

main()

app.listen(process.env.PORT ?? 4000, () => {
  console.log(`Server is running on port ${process.env.PORT ?? 4000}`)
})
