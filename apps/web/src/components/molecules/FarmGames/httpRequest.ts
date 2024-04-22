import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance, AxiosResponse } from "axios"
import { FarmGamesPayload } from "./controller"
import { IntentionCodes } from "./types"

type FarmGamesOutput = {
  message: string
}

export async function httpFarmGames(
  payload: FarmGamesPayload,
  getAPI: () => Promise<AxiosInstance>,
  msg = new MessageMaker<IntentionCodes>()
): Promise<DataOrMessage<string, IntentionCodes>> {
  const api = await getAPI()
  const [error, response] = await resolvePromiseToMessage(
    api.post<any, AxiosResponse<FarmGamesOutput>, FarmGamesPayload>("/farm/start", payload).then(() => ({
      status: 200,
      data: {
        message: "Farm iniciado.",
      },
    }))
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
