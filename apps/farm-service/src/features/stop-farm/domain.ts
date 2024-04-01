import { DataOrFail, Fail } from "core"
import { UsersSACsFarmingClusterStorage } from "~/application/services"
import { bad, nice } from "~/utils/helpers"

export interface IStopFarmDomain {
  execute(props: StopFarmDomainProps): DataOrFail<Fail>
}

type StopFarmDomainProps = {
  username: string
  accountName: string
  isFinalizingSession: boolean
}

export class StopFarmDomain implements IStopFarmDomain {
  constructor(private readonly usersClusterStorage: UsersSACsFarmingClusterStorage) {}

  execute({ username, accountName, isFinalizingSession }: StopFarmDomainProps) {
    const [errorFindingUserCluster, userCluster] = this.usersClusterStorage.get(username)
    if (errorFindingUserCluster) return bad(errorFindingUserCluster)

    const [errorPausingFarmOnAccount, usages] = userCluster.pauseFarmOnAccountSync({
      accountName,
      isFinalizingSession,
    })
    if (errorPausingFarmOnAccount) return bad(errorPausingFarmOnAccount)

    return nice({ usages })
  }
}
