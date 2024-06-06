import { stripe } from "~/infra/services/stripe"

async function main() {
  const customers = await stripe.customers.list({
    limit: 100,
  })
  const results = await Promise.allSettled(
    customers.data.map(c => {
      console.log("Deleting ", c.name)
      return stripe.customers.del(c.id)
    })
  )

  console.log({ results })
}

main()
