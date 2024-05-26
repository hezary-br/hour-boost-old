import { User } from "core"
import { ALS_username, ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { InitUserGatewayStripe } from "~/contracts/InitUserGatewayStripe"
import { usersRepository } from "~/presentation/instances"

async function run(user: User) {
  const initUserGateway = new InitUserGatewayStripe()
  const [error, result] = await initUserGateway.execute(user)
  if (error) {
    switch (error.code) {
      case "FAILED-TO-CREATE-STRIPE-CUSTOMER":
      case "FAILED-TO-LIST-STRIPE-SUBSCRIPTIONS":
      case "FAILED-TO-LIST-STRIPE-SUBSCRIPTIONS":
      case "FAILED-TO-CREATE-STRIPE-SUBCRIPTION":
        return
      default:
        error satisfies never
    }
  }
  ctxLog(result)
  // const [error, result] = await createStripeSubcriptionIfDontExists(customer)
  // console.log(`${user.username} - ${result.code}`)
}

export async function main() {
  const users = await usersRepository.findMany()

  await Promise.allSettled(
    users.map(async user => {
      return await ALS_username.run(user.username, async () => {
        return await run(user)
      })
    })
  )
}

main()
