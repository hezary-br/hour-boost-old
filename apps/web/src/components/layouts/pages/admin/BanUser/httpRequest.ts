import { api } from "@/lib/axios"
import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { saferAsync } from "@hourboost/utils"
import { AxiosError, AxiosResponse } from "axios"
import { UserAdminActionBanUserPayload } from "./controller"
import { IntentionCodes } from "./types"

type UserAdminActionBanUserOutput = {
  message: string
}

export async function httpUserAdminActionBanUser(
  payload: UserAdminActionBanUserPayload,
  msg = new MessageMaker<IntentionCodes>(),
  getToken: () => Promise<string | null>
): Promise<DataOrMessage<string, IntentionCodes>> {
  const token = await getToken()
  const [error] = await saferAsync(() =>
    api.post<any, AxiosResponse<UserAdminActionBanUserOutput>, UserAdminActionBanUserPayload>(
      "/admin/ban-user",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    )
  )
  console.log(error)
  if (error) {
    if (error instanceof AxiosError) {
      return [msg.new(error.response?.data.message, "error", error.response?.data.code)]
    }
    console.log(error.constructor)
    return [msg.new("Erro desconhecido.", "error", "UNKNOWN")]
  }
  return [null, `O usuário ${payload.username} foi banido da plataforma.`]
}

// api.post<any, AxiosResponse<UserAdminActionBanUserOutput>, UserAdminActionBanUserPayload>(
//   "/farm/stop",
//   payload
