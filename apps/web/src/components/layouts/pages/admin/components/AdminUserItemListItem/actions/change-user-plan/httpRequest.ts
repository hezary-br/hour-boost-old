import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance, AxiosResponse } from "axios"
import { UserAdminActionChangeUserPlanPayload, UserAdminActionChangeUserPlanPayloadAll } from "./controller"
import { IntentionCodes } from "./types"

type UserAdminActionChangeUserPlanOutput = {
  message: string
}

export async function httpUserAdminActionChangeUserPlan(
  payload: UserAdminActionChangeUserPlanPayloadAll,
  getAPI: () => Promise<AxiosInstance>,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const api = await getAPI()
  const [error, response] = await resolvePromiseToMessage(
    (async () => {
      await api.post<
        any,
        AxiosResponse<UserAdminActionChangeUserPlanOutput>,
        UserAdminActionChangeUserPlanPayload
      >("/admin/change-user-plan", {
        newPlanName: payload.newPlanValue,
        userId: payload.userId,
      })
      return {
        status: 200,
        data: {
          message: `O plano de ${payload.username} foi alterado para ${payload.newPlanName}.`,
        },
      }
    })()
  )
  if (error) {
    return [error]
  }
  if (response.status === 200) {
    return [null, response.data.message]
  }
  console.log({ response })
  return [msg.new("Resposta desconhecida.", "info")]
}
