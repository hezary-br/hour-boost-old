import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance, AxiosResponse } from "axios"
import { UserAdminActionAddHoursPayload } from "./controller"
import { IntentionCodes } from "./types"

type UserAdminActionAddHoursOutput = {
  message: string
}

export async function httpUserAdminActionAddHours(
  payload: UserAdminActionAddHoursPayload,
  getAPI: () => Promise<AxiosInstance>,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const api = await getAPI()
  const [error, response] = await resolvePromiseToMessage(
    (async () => {
      await api.post<any, AxiosResponse<UserAdminActionAddHoursOutput>, UserAdminActionAddHoursPayload>(
        "/admin/add-usage",
        payload
      )

      return {
        status: 200,
        data: {
          message: `Você adicionou ${(payload.usageTimeInSeconds / 60 / 60).toFixed(2)} horas a mais no plano.`,
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

// api.post<any, AxiosResponse<UserAdminActionAddHoursOutput>, UserAdminActionAddHoursPayload>(
//   "/farm/stop",
//   payload
