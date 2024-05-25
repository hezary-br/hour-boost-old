import { CacheState, GuestPlan } from "core"
import { updateCacheStates } from "./updateCacheStates"

test("should trim all games list to new plan requirements", async () => {
  const commonProps = {
    planId: "plan_123",
    status: "online",
    username: "john",
    farmStartedAt: new Date("2024-02-10T10:00:00.000Z"),
  } as const
  const currentStates = [
    CacheState.restore({
      ...commonProps,
      gamesPlaying: [100, 200, 300, 400],
      gamesStaging: [100, 200, 300, 400],
      accountName: "foo",
    }),
    CacheState.restore({
      ...commonProps,
      gamesPlaying: [100, 200, 300, 400, 500, 700],
      gamesStaging: [100, 200, 300, 400, 500, 800, 900, 999],
      accountName: "mrks",
    }),
  ]

  const newPlan = GuestPlan.create({
    ownerId: "user_123",
  })

  expect(currentStates[0].gamesPlaying.length).toBe(4)
  expect(currentStates[0].gamesStaging.length).toBe(4)
  expect(currentStates[1].gamesPlaying.length).toBe(6)
  expect(currentStates[1].gamesStaging.length).toBe(8)

  const newStates = updateCacheStates({
    currentSACStates: currentStates,
    plan: newPlan,
  })

  expect(newStates[0].gamesPlaying.length).toBe(1)
  expect(newStates[0].gamesStaging.length).toBe(1)
  expect(newStates[1].gamesPlaying.length).toBe(1)
  expect(newStates[1].gamesStaging.length).toBe(1)
})
