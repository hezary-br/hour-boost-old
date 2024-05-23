import { validatePlanCommand } from "~/presentation/routes/mercado-pago/checkout.utils"

test("should cancel only if the current preapprovalid matches the gateway preapproval id", async () => {
  expect(
    validatePlanCommand({
      preapprovalUserCurrent: {
        preapprovalId: "abc",
        status: "authorized",
      },
      preapprovalFromGateway: {
        id: "abc",
        status: "cancelled",
      },
    })
  ).toBe("cancel")
})

test("should NOT cancel if the current preapprovalid does not match the gateway preapproval id", async () => {
  expect(
    validatePlanCommand({
      preapprovalUserCurrent: {
        preapprovalId: "abc",
        status: "authorized",
      },
      preapprovalFromGateway: {
        id: "maybe_old_id",
        status: "cancelled",
      },
    })
  ).toBe("unexpected")
})

test("should assign if there is a new preapproval id command with status authorized", async () => {
  expect(
    validatePlanCommand({
      preapprovalUserCurrent: {
        preapprovalId: "abc",
        status: "authorized",
      },
      preapprovalFromGateway: {
        id: "maybe_old_id",
        status: "authorized",
      },
    })
  ).toBe("assign")
})

test("should do nothing, since nothing changed", async () => {
  expect(
    validatePlanCommand({
      preapprovalUserCurrent: {
        preapprovalId: "abc",
        status: "authorized",
      },
      preapprovalFromGateway: {
        id: "abc",
        status: "authorized",
      },
    })
  ).toBe("unexpected")
})

test("should do nothing in case current preapproval is already cancelled", async () => {
  expect(
    validatePlanCommand({
      preapprovalUserCurrent: {
        preapprovalId: "abc",
        status: "cancelled",
      },
      preapprovalFromGateway: {
        id: "abc",
        status: "cancelled",
      },
    })
  ).toBe("unexpected")
})

test("should do nothing in case current preapproval enter into pending mode", async () => {
  expect(
    validatePlanCommand({
      preapprovalUserCurrent: {
        preapprovalId: "abc",
        status: "authorized",
      },
      preapprovalFromGateway: {
        id: "abc",
        status: "pending",
      },
    })
  ).toBe("unexpected")
})
