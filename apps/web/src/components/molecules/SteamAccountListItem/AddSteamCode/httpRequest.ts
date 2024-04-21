import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance } from "axios"
import { AddSteamGuardPayload } from "./controller"
import { IntentionCodes } from "./types"

type AddSteamGuardOutput = {
  message: string
}

export async function httpAddSteamGuard(
  payload: AddSteamGuardPayload,
  getAPI: () => Promise<AxiosInstance>,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const api = await getAPI()
  const [error, response] = await resolvePromiseToMessage(
    (async () => {
      await new Promise<AddSteamGuardOutput>(res => {
        setTimeout(() => {
          res({ message: "msg" })
        }, 1000)
      })
      // await api.post<any, AxiosResponse<AddSteamGuardOutput>, AddSteamGuardPayload>(
      //   "/admin/unban-user",
      //   payload
      // )
      return {
        status: 200,
        data: {
          message: `Steam Guard aceito.`,
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
