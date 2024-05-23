import { checkShouldPersist } from "~/presentation/routes/mercado-pago/checkout.utils"

test("should save new preapproval", async () => {
  const shouldPersist = checkShouldPersist({
    isNewPreapproval: true,
    status: "authorized",
  })

  expect(shouldPersist).toBe("new-should-save")
})

test("should ALWAYS update if preapproval is known of application", async () => {
  const shouldPersist = checkShouldPersist({
    isNewPreapproval: false,
    status: "authorized",
  })

  expect(shouldPersist).toBe("existing-should-update")
})

test("should skip if the new preapproval is something else than `authorized`", async () => {
  const shouldPersist = checkShouldPersist({
    isNewPreapproval: true,
    status: "cancelled",
  })

  expect(shouldPersist).toBeUndefined()
})

test("should ALWAYS update if preapproval is known of application", async () => {
  const shouldPersist = checkShouldPersist({
    isNewPreapproval: false,
    status: "cancelled",
  })

  expect(shouldPersist).toBe("existing-should-update")
})
