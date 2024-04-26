import { UsersDAO } from "core/contracts"
import { UserSession } from "core/presenters/user-presenter"

export class GetUser {
  constructor(private readonly usersDAO: UsersDAO) { }

  async execute(userId: string): Promise<UserSession | null> {
    return this.usersDAO.getByID(userId)
  }
}
