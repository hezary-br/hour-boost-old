import { ALS_username, ctxLog } from "~/application/use-cases/RestoreAccountManySessionsUseCase"
import { InitUserGatewayStripe } from "~/contracts/InitUserGatewayStripe"
import { stripe } from "~/infra/services/stripe"
import { usersRepository } from "~/presentation/instances"

const initUserGateway = new InitUserGatewayStripe(stripe)

export async function main() {
  const users = await usersRepository.findMany()

  await Promise.allSettled(
    users.map(async user => {
      return await ALS_username.run(user.username, async () => {
        const [error, result] = await initUserGateway.execute(user)
        if (error) {
          switch (error.code) {
            case "FAILED-TO-CREATE-STRIPE-CUSTOMER":
            case "ERROR-CREATING-USER":
              return void console.log(error)
            default:
              error satisfies never
          }
        }
        ctxLog(result)
      })
    })
  )
}

main()
