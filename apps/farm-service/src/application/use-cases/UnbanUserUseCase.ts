import { DataOrFail, Fail, type UsersRepository } from "core"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { bad, nice } from "~/utils/helpers"

export class UnbanUserUseCase implements IUnbanUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(banningUserId: string) {
    const [error, user] = await getUser(this.usersRepository, banningUserId)
    if (error) return bad(error)
    user.unban()
    await this.usersRepository.update(user)

    return nice()
  }
}

interface IUnbanUserUseCase {
  execute(banningUserId: string): Promise<DataOrFail<Fail>>
}
