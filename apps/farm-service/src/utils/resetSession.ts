import { CacheState } from "core"

export function resetSession(state: CacheState) {
  if (state.isFarming()) {
    // reset farm started at, add extra few seconds
    // till it reach the client, UX enhancement
    const nowSlightlyInTheFuture = new Date(Date.now() + 1000 * 5)
    state.setFarmStartedAt(nowSlightlyInTheFuture)
  }
}
