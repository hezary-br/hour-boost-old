import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance, AxiosResponse } from "axios"
import { ChangeAccountStatusPayload } from "./controller"
import { IntentionCodes } from "./types"

type ChangeAccountStatusOutput = {
  message: string
}

export async function httpChangeAccountStatus(
  payload: ChangeAccountStatusPayload,
  getAPI: () => Promise<AxiosInstance>,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const api = await getAPI()
  const [error, response] = await resolvePromiseToMessage(
    (async () => {
      const res = await api.patch<any, AxiosResponse<ChangeAccountStatusOutput>, ChangeAccountStatusPayload>(
        "/account/status",
        payload
      )
      return {
        status: 200,
        data: {
          message: res.data.message,
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
