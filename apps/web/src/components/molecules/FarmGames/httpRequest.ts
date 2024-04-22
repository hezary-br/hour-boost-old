import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { FarmGamesPayload } from "./controller"

type FarmGamesOutput = {
  message: string
}

export type SuccessResponse = {
  message: string
}

export async function httpFarmGames(payload: FarmGamesPayload, getAPI: () => Promise<AxiosInstance>) {
  const api = await getAPI()
  try {
    await api.post<any, AxiosResponse<FarmGamesOutput>, FarmGamesPayload>("/farm/start", payload)
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message)
    }

    throw error
  }
}
