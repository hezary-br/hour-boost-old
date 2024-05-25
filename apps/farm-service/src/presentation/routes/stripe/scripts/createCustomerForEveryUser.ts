import { User } from "core"
import { usersRepository } from "~/presentation/instances"
import { createStripeSubcriptionIfDontExists, getOrCreateCustomer } from "~/presentation/routes/stripe"

async function run(user: User) {
  const customer = await getOrCreateCustomer({ email: user.email, name: user.username })
  const result = await createStripeSubcriptionIfDontExists(customer)
  console.log(`${user.username} - ${result.code}`)
}

export async function main() {
  const users = await usersRepository.findMany()

  await Promise.all(
    users.map(async user => {
      return await run(user).then(() => {
        console.log("Created customer for " + user.username)
      })
    })
  )
}

main()
