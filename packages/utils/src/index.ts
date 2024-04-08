import { bad, nice } from "core"

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
