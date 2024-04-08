import type { Clerk } from "@clerk/clerk-sdk-node"
import type { IClerkUser, UserAuthentication } from "core"

export class ClerkAuthentication implements UserAuthentication {
  constructor(private readonly clerkClient: ReturnType<typeof Clerk>) {}

  async getUserByID(userId: string): Promise<IClerkUser> {
    const clerkUser = await this.clerkClient.users.getUser(userId)
    return {
      email: clerkUser.emailAddresses[0].emailAddress,
      id_user: clerkUser.id,
      profilePic: clerkUser.imageUrl,
      username: clerkUser.username ?? `guest_${Math.random().toString(36).substring(2, 12)}`,
    }
  }
}
