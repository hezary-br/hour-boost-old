import { createWebhookId } from "~/presentation/routes/checkout.utils"

/**
 * webhookPreapprovalId = MAYBE OLD ID?
 * userCurrentPreapprovalGatewayId is the source of truth
 */

test("should be NEW CURRENT when current gateway pre-id differs from current app pre-id", async () => {
  const webhookId = createWebhookId({
    userCurrentPreapprovalApplicationPreapprovalId: "old_id",
    userCurrentPreapprovalGatewayId: "latest_id",
    webhookPreapprovalId: "latest_id",
  })
  expect(webhookId.isNewCurrent).toBe(true)
  expect(webhookId.isCurrent).toBe(true)
})

test("should NOT be NEW CURRENT when current gateway pre-id is the same from current app pre-id", async () => {
  const webhookId = createWebhookId({
    userCurrentPreapprovalApplicationPreapprovalId: "latest_id",
    userCurrentPreapprovalGatewayId: "latest_id",
    webhookPreapprovalId: "latest_id",
  })
  expect(webhookId.isNewCurrent).toBe(false)
  expect(webhookId.isCurrent).toBe(true)
})

test("should NOT be current when current gateway pre-id differs from current app pre-id", async () => {
  const webhookId = createWebhookId({
    userCurrentPreapprovalApplicationPreapprovalId: "some_id",
    userCurrentPreapprovalGatewayId: "latest_id",
    webhookPreapprovalId: "some_id",
  })
  expect(webhookId.isNewCurrent).toBe(false)
  expect(webhookId.isCurrent).toBe(false)
})

test("should NOT be current when the webhook id differs from others pre-id", async () => {
  const webhookId = createWebhookId({
    userCurrentPreapprovalApplicationPreapprovalId: "latest_id",
    userCurrentPreapprovalGatewayId: "latest_id",
    webhookPreapprovalId: "different_id",
  })
  expect(webhookId.isNewCurrent).toBe(false)
  expect(webhookId.isCurrent).toBe(false)
})
