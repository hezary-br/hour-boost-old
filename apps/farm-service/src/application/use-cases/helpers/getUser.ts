import { Fail, UsersRepository, bad } from "core"
import { EAppResults } from "~/application/use-cases"
import { nice } from "~/utils/helpers"

export async function getUser(usersRepository: UsersRepository, userId: string) {
  const user = await usersRepository.getByID(userId)
  if (!user) {
    const fail = new Fail({
      code: EAppResults["USER-NOT-FOUND"],
      httpStatus: 404,
      payload: {
        givenUserId: userId,
      },
    })
    return bad(fail)
  }
  return nice(user)
}

export async function getUserByEmail(usersRepository: UsersRepository, email: string) {
  const user = await usersRepository.getByEmail(email)
  if (!user) {
    const fail = new Fail({
      code: EAppResults["USER-NOT-FOUND"],
      httpStatus: 404,
      payload: {
        givenEmail: email,
      },
    })
    return bad(fail)
  }
  return nice(user)
}
