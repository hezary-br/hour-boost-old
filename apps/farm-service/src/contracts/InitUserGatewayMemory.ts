import { User } from "core"
import { InitUserGateway } from "~/contracts/InitUserGateway"
import { nice } from "~/utils/helpers"

export class InitUserGatewayMemory implements InitUserGateway {
  async execute(user: User) {
    return nice("CUSTOMER-CREATED-AND-SUBSCRIPTION-MADE")
  }
}
