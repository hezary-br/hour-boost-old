import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { CancelSubscriptionPayload } from "./controller"
import { UseCancelSubscriptionResult } from "./types"

export type SuccessResponse = {
  message: string
}

export async function httpCancelSubscription(getAPI: () => Promise<AxiosInstance>) {
  const api = await getAPI()
  try {
    const { data } = await api.delete<
      UseCancelSubscriptionResult,
      AxiosResponse<UseCancelSubscriptionResult>,
      CancelSubscriptionPayload
    >("/subscription/current")

    return data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message)
    }

    throw error
  }
}
