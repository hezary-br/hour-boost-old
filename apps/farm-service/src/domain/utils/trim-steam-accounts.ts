import { DataOrFail, Fail, PlanInfinity, PlanUsage, User } from "core"
import { RemoveSteamAccount } from "~/features/remove-steam-account/domain"
import { bad, nice, only } from "~/utils/helpers"
import { trimAccountsName } from "~/utils/trimAccountsName"

interface ITrimSteamAccounts {
  execute(props: Input): DataOrFail<Fail>
}

export class TrimSteamAccounts implements ITrimSteamAccounts {
  constructor(private readonly removeSteamAccount: RemoveSteamAccount) {}

  execute({ user, plan }: Input) {
    const trimmingAccountsName = trimAccountsName({
      plan,
      steamAccounts: user.steamAccounts.data,
    })

    const [errors, trimmingAccountsResults] = batchOperations(
      trimmingAccountsName.map(accountName =>
        this.removeSteamAccount.execute({
          accountName,
          user,
        })
      )
    )
    if (errors) return bad(Fail.create("LIST::TRIMMING-ACCOUNTS", 400, errors))

    return nice({
      trimmingAccountsName,
      trimmingAccountsResults,
    })
  }
}

export function batchOperations<const T extends DataOrFail<Fail>>(results: T[]) {
  const [errors, datas] = results.reduce(
    (acc: [NonNullable<T[0]>[], NonNullable<T[1]>[]], [error, data]) => {
      if (error) acc[0].push(error)
      else acc[1].push(data)
      return acc
    },
    [[], []]
  )

  if (errors.length === 0) return nice(datas)
  return only([errors, datas])
}

function batchOperationsSingleError<
  const T extends DataOrFail<Fail>,
  const TCode extends string = string,
  const THTTPStatus extends number = number,
>(results: T[], code: TCode, httpStatus?: THTTPStatus) {
  const [errors, datas] = batchOperations(results)
  if (errors) return bad(Fail.create(code, httpStatus ?? 400, errors))
  return nice(datas)
}

type Input = {
  user: User
  plan: PlanUsage | PlanInfinity
}
