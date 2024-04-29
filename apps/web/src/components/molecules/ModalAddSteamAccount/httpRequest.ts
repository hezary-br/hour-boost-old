import { Message } from "@/util/DataOrMessage"
import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { AddSteamAccountHTTPResponse } from "core"
import { CreateSteamAccountPayload } from "./controller"

export async function httpCreateSteamAccount(
  payload: CreateSteamAccountPayload,
  getApi: () => Promise<AxiosInstance>
): Promise<string | Message<any>> {
  const api = await getApi()

  try {
    const response = await api.post<any, AxiosResponse<AddSteamAccountHTTPResponse>, CreateSteamAccountPayload>(
      "/steam-accounts",
      payload,
    )
    console.log(response)
    if (response.status === 201) {
      return "Conta adicionada com sucesso."
    }
    if (response.status === 202) {
      return new Message("Código Steam Guard requerido.", "info", "STEAM-GUARD-REQUIRED")
    }

    if (typeof response.data?.message !== "string") {
      throw response
    }

    console.log("response data.messag")
    return response.data.message
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message)
    }

    throw error
  }
}
