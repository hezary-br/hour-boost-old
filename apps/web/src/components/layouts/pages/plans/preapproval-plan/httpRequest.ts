import { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { PreApprovalPlanPayload } from "./controller"
// 
type PreApprovalPlanOutput = {
  message: string
}

export type SuccessResponse = {
  message: string
}

export async function httpPreApprovalPlan(payload: PreApprovalPlanPayload, getAPI: () => Promise<AxiosInstance>) {
  const api = await getAPI()
  try {
    await api.post<any, AxiosResponse<PreApprovalPlanOutput>, PreApprovalPlanPayload>("/plan/preapproval", payload)
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message)
    }

    throw error
  }
}
