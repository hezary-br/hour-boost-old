import { calculatePreviousPreapprovalId } from "~/presentation/routes/checkout.utils"

test("should sjdfids", async () => {
  const prevId = calculatePreviousPreapprovalId({
    isNewPreapproval: false,
    previousApplicationPreapprovalId: "123",
    userCurrentPreapprovalId: "abc",
  })
  expect(prevId).toBe("123")
})

test("should sjdfids", async () => {
  const prevId = calculatePreviousPreapprovalId({
    isNewPreapproval: true,
    previousApplicationPreapprovalId: "123",
    userCurrentPreapprovalId: "abc",
  })
  expect(prevId).toBe("123")
})

test("should sjdfids", async () => {
  const prevId = calculatePreviousPreapprovalId({
    isNewPreapproval: false,
    previousApplicationPreapprovalId: null,
    userCurrentPreapprovalId: "abc",
  })
  expect(prevId).toBe(null)
})

test("should sjdfids", async () => {
  const prevId = calculatePreviousPreapprovalId({
    isNewPreapproval: true,
    previousApplicationPreapprovalId: null,
    userCurrentPreapprovalId: "abc",
  })
  expect(prevId).toBe("abc")
})
