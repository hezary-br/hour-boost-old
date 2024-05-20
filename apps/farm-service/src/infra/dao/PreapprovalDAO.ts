export type UserId = { userId: string }
export type PreapprovalId = { preapprovalId: string }
export type PreapprovalQueryId = UserId | PreapprovalId

export interface PreapprovalDAO {
  getPreviousPreapprovalId(preapprovalId: string): Promise<string | null>
  getCurrentPreapprovalId(userId: string): Promise<string | null>
}
