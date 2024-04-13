import { bad, nice } from "./helpers"

export function safer<TResult>(action: () => TResult) {
  try {
    const actionReturn = action()
    return nice(actionReturn)
  } catch (error) {
    if (error instanceof Error) {
      return bad(error)
    }
    return bad(new Error(JSON.stringify(error)))
  }
}
export async function saferAsync<TResult>(action: () => Promise<TResult>) {
  try {
    const actionReturn = await action()
    return nice(actionReturn)
  } catch (error) {
    if (error instanceof Error) {
      return bad(error)
    }
    return bad(new Error(JSON.stringify(error)))
  }
}
