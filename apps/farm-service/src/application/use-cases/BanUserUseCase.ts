import { DataOrFail, Fail, type UsersRepository } from "core"
import { getUser } from "~/application/use-cases/helpers/getUser"
import { bad, nice } from "~/utils/helpers"

export class BanUserUseCase implements IBanUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(banningUserId: string) {
    const [error, user] = await getUser(this.usersRepository, banningUserId)
    if(error) return bad(error)
      user.ban()
    await this.usersRepository.update(user)

    return nice()
  }
}

interface IBanUserUseCase {
  execute(banningUserId: string): Promise<DataOrFail<Fail>>
}
