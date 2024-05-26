import { DataOrFail, Fail, User } from "core"

export interface InitUserGateway {
  execute(user: User): Promise<DataOrFail<Fail, string>>
}
