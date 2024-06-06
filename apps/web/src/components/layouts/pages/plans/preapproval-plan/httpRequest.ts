import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { PreApprovalPlanPayload } from "./controller"
import { UsePreApprovalPlanResult } from "./types"

export type SuccessResponse = {
  message: string
}

export async function httpPreApprovalPlan(
  payload: PreApprovalPlanPayload,
  getAPI: () => Promise<AxiosInstance>
) {
  const api = await getAPI()
  try {
    const { data } = await api.post<
      UsePreApprovalPlanResult,
      AxiosResponse<UsePreApprovalPlanResult>,
      PreApprovalPlanPayload
    >("/plan/preapproval", payload)

    return data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message)
    }

    throw error
  }
}
