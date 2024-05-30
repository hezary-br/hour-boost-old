import { CancelUserSubscriptionUseCase } from "~/application/use-cases/CancelUserSubscriptionUseCase"
import { stripe } from "~/infra/services/stripe"
import { rollbackToGuestPlanUseCase, usersRepository } from "~/presentation/instances"

export async function main() {
  const cancelUserSubscriptionUseCase = new CancelUserSubscriptionUseCase(
    stripe,
    rollbackToGuestPlanUseCase,
    usersRepository
  )
  const [error, result] = await cancelUserSubscriptionUseCase.execute({
    email: "contatodestakimports@gmail.com",
  })
  if (error) return console.log(error)
  console.log(result)
}

main()
