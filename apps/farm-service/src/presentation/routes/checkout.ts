import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { Fail, PlanAllNames, User, bad } from "core"
import { Router } from "express"
import { appendFile } from "fs"
import { PreApprovalResponse } from "mercadopago/dist/clients/preApproval/commonTypes"
import z from "zod"
import { Preapproval } from "~/infra/repository/PreapprovalRepository"
import { gatewayPreApprovalGateway } from "~/infra/services/checkout/Mercadopago"
import { getPreapprovalData } from "~/infra/services/checkout/get-approval"
import { PlanPayload } from "~/infra/services/checkout/metadata"
import { validateBody } from "~/inline-middlewares/validate-payload"
import {
  changeUserPlanUseCase,
  preapprovalRepository,
  purchaseNewPlanController,
  usersRepository,
} from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import {
  MakePlanCommandProps,
  PreapprovalDAOMemory,
  assignNewPlan,
  getApplicationPreapprovalById,
  getCurrentPreapproval,
  getPreviousPreapprovalId,
  rollbackPlan,
  saveNewPreapproval,
  updatePreapproval,
  validatePlanCommand,
} from "~/presentation/routes/checkout.utils"
import { cancelRunningPreapprovalsOnGateway } from "~/presentation/routes/gateway.utils"
import { nice } from "~/utils/helpers"

export const router_checkout: Router = Router()
const preapprovalDAO = new PreapprovalDAOMemory()

router_checkout.post("/plan/preapproval", ClerkExpressRequireAuth(), async (req, res) => {
  const [invalidBody, body] = validateBody(
    req.body,
    z.object({
      userId: z.string().min(1, "Informe o ID do usuário."),
      email: z.string().email("Informe um e-mail válido."),
      planName: z.enum(["DIAMOND", "GOLD", "GUEST", "SILVER"], {
        message: "Tipo de plano inválido.",
      }),
    })
  )
  if (invalidBody) return res.status(invalidBody.status).json(invalidBody.json)
  const { planName, userId, email } = body

  const presentation = await purchaseNewPlanController.handle({ planName, userId, email })
  return RequestHandlerPresenter.handle(presentation, res)
})

router_checkout.post("/webhook", async (req, res) => {
  const { action, type, data } = req.body
  appendFile("logs/webhooks.txt", `${new Date().toISOString()} - ${JSON.stringify(req.body)} \r\n`, () => {})
  console.log({ action, type, data })

  switch (action) {
    case "created":
    case "updated":
      const [preapprovalDomain, preapprovalGateway] = await Promise.all([
        preapprovalRepository.getByPrepprovalId(data.id),
        gatewayPreApprovalGateway.get({
          id: data.id,
        }),
      ])
      const shouldSyncPreapproval = !Boolean(preapprovalDomain?.status === preapprovalGateway.status)
      console.log({
        shouldSyncPreapproval,
        preapprovalDomainStatus: preapprovalDomain?.status,
        preapprovalGatewayStatus: preapprovalGateway.status,
      })

      const checkoutPayload = PlanPayload.parse(preapprovalGateway.external_reference!)
      const { userId } = checkoutPayload

      const user = await usersRepository.getByID(userId)
      if (!user)
        // provavelmente precisa cancelar
        throw new Error(
          `NSTH! Houve mudança na assinatura do usuário com ID: [${userId}], mas ele não foi encontrado no banco de dados.`
        )

      const validationResult = z.enum(["authorized", "cancelled"]).safeParse(preapprovalGateway.status)
      if (!validationResult.success) {
        console.log("Unknown status: ", preapprovalGateway.status)
        return res.sendStatus(200)
      }
      const status = validationResult.data

      const [previousPreapprovalId, userCurrentPreapproval, applicationPreapprovalWithThatId] =
        await Promise.all([
          getPreviousPreapprovalId({
            preapprovalDAO,
            userId,
          }),
          getCurrentPreapproval({
            userId,
            preapprovalRepository,
          }),
          getApplicationPreapprovalById({
            preapprovalId: data.id,
            preapprovalRepository,
          }),
        ])

      const { planName } = checkoutPayload
      const preapproval = new Preapproval({
        createdAt: new Date(preapprovalGateway.date_created ?? Date.now()),
        planName,
        preapprovalId: data.id,
        previousPreapprovalId,
        status,
        userId,
        payerId: preapprovalGateway.payer_id,
      })

      const isNewPreapproval = !Boolean(applicationPreapprovalWithThatId)
      if (isNewPreapproval) {
        await saveNewPreapproval({ preapproval, preapprovalRepository })
      } else {
        await updatePreapproval({ preapproval, preapprovalRepository })
      }

      const validationInput: MakePlanCommandProps = {
        preapprovalFromGateway: preapprovalGateway,
        preapprovalUserCurrent: userCurrentPreapproval,
      }

      const planCommand = validatePlanCommand(validationInput)

      switch (planCommand) {
        case "cancel":
          const [errorCancelling] = await rollbackPlan({ changeUserPlanUseCase, user })
          if (errorCancelling) return res.status(errorCancelling.status).json(errorCancelling.json)
        case "assign":
          const [error] = await cancelRunningPreapprovalsOnGateway({
            gatewayPreApprovalGateway,
            preapprovalId: data.id,
            payerId: preapproval.payerId,
          })
          if (error) {
            console.log(error)
            return res.status(error.httpStatus).json(error.payload)
          }

          const [errorAssigning] = await assignNewPlan({ changeUserPlanUseCase, planName, user })
          if (errorAssigning) return res.status(errorAssigning.status).json(errorAssigning.json)
        case "unexpected":
          break
        default:
      }
    default:
  }
  return res.status(200).end()
})

router_checkout.get("/preapproval/:preapprovalId", async (req, res) => {
  const { preapprovalId } = req.params
  const approvalData = await getPreapprovalData({ id: preapprovalId })
  if (approvalData.error) {
    console.log({ error: approvalData.info })
    return res.status(400).end()
  }

  return res.json(approvalData.plan)
})

router_checkout.get("/preapprovals", async (req, res) => {
  const preapprovals = await preapprovalRepository.list()
  return res.json(preapprovals)
})

type ChangeUserPlanDuePreapprovalProps = {
  planName: PlanAllNames
  user: User
  preapprovalGateway: PreApprovalResponse
}

async function changeUserPlanDuePreapproval({
  preapprovalGateway,
  planName,
  user,
}: ChangeUserPlanDuePreapprovalProps) {}

async function changeUserPlanDuePreapprovalCancelment({
  preapprovalGateway,
  planName,
  user,
}: ChangeUserPlanDuePreapprovalProps) {
  const [error] = await changeUserPlanUseCase.execute({
    newPlanName: "GUEST",
    user,
  })
  if (error)
    return bad(
      new Fail({
        code: "FAILED-TO-CANCEL-PLAN",
        httpStatus: 400,
        payload: { preapprovalGateway, error, planName, user },
      })
    )

  return nice()
}
