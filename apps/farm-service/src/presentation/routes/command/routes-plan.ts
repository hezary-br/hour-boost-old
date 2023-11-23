import { ApplicationError, PlanUsage, Usage } from "core"
import { Router } from "express"
import { prisma } from "~/infra/libs"
import { PlanRepositoryDatabase } from "~/infra/repository"
import { promiseHandler } from "~/presentation/controllers/promiseHandler"
import { makeRes } from "~/utils"

export const command_routerPlan: Router = Router()

command_routerPlan.post("/usage", async (req, res) => {
  const planRepository = new PlanRepositoryDatabase(prisma)

  const perform = async () => {
    const { amountTime, planID, accountName, secret } = req.body
    if (!secret) throw new ApplicationError("Essa ação requer uma chave secreta.")
    if (secret !== process.env.ACTIONS_SECRET) throw new ApplicationError("Chave secreta inválida.", 403)
    const plan = await planRepository.getById(planID)
    if (!plan) throw new ApplicationError("Plano com esse ID não pode ser encontrado.")
    if (!(plan instanceof PlanUsage)) throw new ApplicationError("Esse plano não é do tipo usage.")
    plan.use(
      Usage.create({
        accountName,
        amountTime,
        createdAt: new Date(),
        plan_id: planID,
      })
    )
    await planRepository.update(plan)
    return makeRes(201, `Successfully added ${amountTime} usage para o plano ${planID}.`)
  }

  const { status, json } = await promiseHandler(perform())

  return res.status(status).json(json)
})

command_routerPlan.delete("/usage", async (req, res) => {
  const planRepository = new PlanRepositoryDatabase(prisma)

  const perform = async () => {
    const { planID, usageID, secret } = req.body
    if (!secret) throw new ApplicationError("Essa ação requer uma chave secreta.")
    if (secret !== process.env.ACTIONS_SECRET) throw new ApplicationError("Chave secreta inválida.", 403)
    const plan = await planRepository.getById(planID)
    if (!plan) throw new ApplicationError("Plano com esse ID não pode ser encontrado.")
    if (!(plan instanceof PlanUsage)) throw new ApplicationError("Esse plano não é do tipo usage.")
    plan.removeUsage(usageID)
    await planRepository.update(plan)
    return makeRes(200, `Successfully removed usage of ID ${usageID}.`)
  }

  const { status, json } = await promiseHandler(perform())

  return res.status(status).json(json)
})
