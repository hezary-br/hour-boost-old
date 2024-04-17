import { api } from "@/lib/axios"
import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosResponse } from "axios"
import { UserAdminActionBanUserPayload } from "./controller"
import { IntentionCodes } from "./types"

type UserAdminActionBanUserOutput = {
  message: string
}

export async function httpUserAdminActionBanUser(
  payload: UserAdminActionBanUserPayload,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const [error, response] = await resolvePromiseToMessage(
    (async () => {
      await api.post<any, AxiosResponse<UserAdminActionBanUserOutput>, UserAdminActionBanUserPayload>(
        "/admin/ban-user",
        payload
      )
      return {
        status: 200,
        data: {
          message: `O usuário ${payload.username} foi banido da plataforma.`,
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

// api.post<any, AxiosResponse<UserAdminActionBanUserOutput>, UserAdminActionBanUserPayload>(
//   "/farm/stop",
//   payload
