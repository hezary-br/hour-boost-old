import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { Fail, PlanAllNames, User, bad } from "core"
import { Router } from "express"
import { PreApprovalResponse } from "mercadopago/dist/clients/preApproval/commonTypes"
import z from "zod"
import { Preapproval } from "~/infra/repository/PreapprovalRepository"
import { gatewayPreApprovalGateway } from "~/infra/services/checkout/Mercadopago"
import { getPreapprovalData } from "~/infra/services/checkout/get-approval"
import { PlanPayload } from "~/infra/services/checkout/metadata"
import { validateBody } from "~/inline-middlewares/validate-payload"
import {
  changeUserPlanUseCase,
  preapprovalDAO,
  preapprovalRepository,
  purchaseNewPlanController,
  usersRepository,
} from "~/presentation/instances"
import { RequestHandlerPresenter } from "~/presentation/presenters/RequestHandlerPresenter"
import {
  MakePlanCommandProps,
  assignNewPlan,
  calculatePreviousPreapprovalId,
  cancelAllPreapprovalsButCurrent,
  checkShouldPersist,
  createWebhookId,
  getApplicationPreapprovalById,
  getCurrentPreapprovalGatewayByPayerId,
  getCurrentPreapprovalRepo,
  getPreviousPreapprovalId,
  rollbackPlan,
  saveNewPreapproval,
  updatePreapproval,
  validatePlanCommand,
} from "~/presentation/routes/mercado-pago/checkout.utils"
import { nice } from "~/utils/helpers"

export const router_checkout: Router = Router()

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

  switch (action) {
    case "created":
    case "updated":
      const preapprovalGateway = await gatewayPreApprovalGateway.get({
        id: data.id,
      })
      const checkoutPayload = PlanPayload.parse(preapprovalGateway.external_reference!)
      const { userId } = checkoutPayload

      const user = await usersRepository.getByID(userId)
      if (!user)
        // provavelmente precisa cancelar
        throw new Error(
          `NSTH! Houve mudança na assinatura do usuário com ID: [${userId}], mas ele não foi encontrado no banco de dados.`
        )
      const { payer_id: payerId } = preapprovalGateway
      if (!payerId) {
        console.log("NSTH: no payer id", { preapprovalGateway, dataId: data.id })
        return res.sendStatus(200)
      }

      const validationResult = z
        .enum(["authorized", "cancelled", "pending"])
        .safeParse(preapprovalGateway.status)
      if (!validationResult.success) {
        console.log("Unknown status: ", preapprovalGateway.status)
        return res.sendStatus(200)
      }
      const status = validationResult.data
      if (status === "pending") {
        return res.sendStatus(200)
      }

      const [
        userCurrentPreapprovalApplication,
        userCurrentPreapprovalGateway,
        applicationPreapprovalWithThatId,
      ] = await Promise.all([
        getCurrentPreapprovalRepo({
          userId,
          preapprovalRepository,
        }),
        getCurrentPreapprovalGatewayByPayerId({
          payerId,
          gatewayPreApprovalGateway,
        }),
        getApplicationPreapprovalById({
          preapprovalId: data.id,
          preapprovalRepository,
        }),
      ])

      const isNewPreapproval = !Boolean(applicationPreapprovalWithThatId)

      const previousApplicationPreapprovalId = await getPreviousPreapprovalId({
        preapprovalDAO,
        preapprovalId: data.id,
      })

      const previousPreapprovalId = calculatePreviousPreapprovalId({
        isNewPreapproval,
        previousApplicationPreapprovalId,
        userCurrentPreapprovalId: userCurrentPreapprovalApplication?.preapprovalId,
      })

      const webhookId = createWebhookId({
        userCurrentPreapprovalApplicationPreapprovalId: userCurrentPreapprovalApplication?.preapprovalId,
        userCurrentPreapprovalGatewayId: userCurrentPreapprovalGateway?.id,
        webhookPreapprovalId: data.id,
      })

      const { planName } = checkoutPayload

      const preapproval = new Preapproval({
        createdAt: new Date(preapprovalGateway.date_created ?? Date.now()),
        planName,
        preapprovalId: data.id,
        previousPreapprovalId,
        status,
        userId,
        payerId: preapprovalGateway.payer_id,
        isCurrent: webhookId.isCurrent,
      })

      /**
       * PROBLEMA: se criar varias sessões de checkout antes
       * de salvar no banco, ele vai cancelar e vai vir
       * várias novas assinaturas para cancelar e fazer rollback
       */
      const shouldPersist = checkShouldPersist({
        isNewPreapproval,
        status,
      })

      if (shouldPersist === "new-should-save")
        await saveNewPreapproval({ preapproval, preapprovalRepository })
      if (shouldPersist === "existing-should-update")
        await updatePreapproval({ preapproval, preapprovalRepository })

      const validationInput: MakePlanCommandProps = {
        preapprovalFromGateway: preapprovalGateway,
        preapprovalUserCurrent: userCurrentPreapprovalApplication,
      }

      const planCommand = validatePlanCommand(validationInput)
      switch (planCommand) {
        case "cancel":
          if (!webhookId.isCurrent) break
          const [errorCancelling] = await rollbackPlan({ changeUserPlanUseCase, user })
          if (errorCancelling) {
            return res.status(errorCancelling.status).json(errorCancelling.json)
          }
        case "assign":
          const [errorCancellingAllButCurrent] = await cancelAllPreapprovalsButCurrent({
            preapprovalRepository,
            gatewayPreApprovalGateway,
            payerId,
            preservingPreapprovalId: data.id,
          })
          if (errorCancellingAllButCurrent) {
            return res.sendStatus(errorCancellingAllButCurrent.httpStatus)
          }

          const [errorAssigning] = await assignNewPlan({ changeUserPlanUseCase, planName, user })
          if (errorAssigning) {
            return res.status(errorAssigning.status).json(errorAssigning.json)
          }
        case "unexpected":
          break
        default:
      }
    default:
  }
  return res.sendStatus(200)
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
