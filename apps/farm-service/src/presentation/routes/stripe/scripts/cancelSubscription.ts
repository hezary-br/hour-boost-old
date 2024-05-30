import { CancelUserSubscriptionUseCase } from "~/application/use-cases/CancelUserSubscriptionUseCase"
import { stripe } from "~/infra/services/stripe"

export async function main() {
  const cancelUserSubscriptionUseCase = new CancelUserSubscriptionUseCase(stripe)
  const [error, result] = await cancelUserSubscriptionUseCase.execute({
    email: "contatodestakimports@gmail.com",
  })
  if (error) return console.log(error)
  console.log(result)
}

main()
