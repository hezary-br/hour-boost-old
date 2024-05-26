import { User, type UserAuthentication, type UsersRepository } from "core"
import type { UsersSACsFarmingClusterStorage } from "~/application/services"
import { InitUserGateway } from "~/contracts/InitUserGateway"

export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userAuthentication: UserAuthentication,
    private readonly usersSACsFarmingClusterStorage: UsersSACsFarmingClusterStorage,
    private readonly initUserGateway: InitUserGateway
  ) {}

  async execute(userId: string): Promise<User> {
    const authUser = await this.userAuthentication.getUserByID(userId)
    const user = User.create({
      email: authUser.email,
      id_user: authUser.id_user,
      profilePic: authUser.profilePic,
      username: authUser.username,
    })
    await this.initUserGateway.execute(user)
    await this.usersRepository.create(user)
    this.usersSACsFarmingClusterStorage.add(user.username, user.plan)
    return user
  }
}
