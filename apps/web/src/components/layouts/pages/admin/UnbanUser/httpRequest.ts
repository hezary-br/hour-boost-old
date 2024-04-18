import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance, AxiosResponse } from "axios"
import { UserAdminActionUnbanUserPayload } from "./controller"
import { IntentionCodes } from "./types"

type UserAdminActionUnbanUserOutput = {
  message: string
}

export async function httpUserAdminActionUnbanUser(
  payload: UserAdminActionUnbanUserPayload,
  getAPI: () => Promise<AxiosInstance>,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const api = await getAPI()
  const [error, response] = await resolvePromiseToMessage(
    (async () => {
      await api.post<any, AxiosResponse<UserAdminActionUnbanUserOutput>, UserAdminActionUnbanUserPayload>(
        "/admin/unban-user",
        payload
      )
      return {
        status: 200,
        data: {
          message: `O usuário ${payload.username} foi desbanido da plataforma.`,
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
