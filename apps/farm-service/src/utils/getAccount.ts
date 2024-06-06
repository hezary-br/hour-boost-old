import type { CacheState } from "core"

type SACStateCacheRepositoryGet = {
  get(accountName: string): Promise<CacheState | null>
}

export function getAccountOnCache(sacStateCacheRepository: SACStateCacheRepositoryGet) {
  return (accountName: string) => sacStateCacheRepository.get(accountName)
}
