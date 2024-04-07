import { UserAdminPanelSession } from "core"
import { useUserAdminList } from "./useUserAdminList"

export function useUserAdminListItem$<Selected = UserAdminPanelSession>(
  userId: string,
  select?: (user: UserAdminPanelSession) => Selected
) {
  return useUserAdminList<Selected>({
    select: userList => {
      const foundUser = userList.find(u => u.id_user === userId)!
      return select ? select(foundUser) : (foundUser as Selected)
    },
  })
}

export function useUserAdminListItem<Selected = UserAdminPanelSession>(
  userId: string,
  select?: (user: UserAdminPanelSession) => Selected
) {
  const result = useUserAdminListItem$(userId, select)

  if (result.status !== "success") {
    throw new Error(
      "Attempt to use `useUserAdminListItem$` before a value being assigned. Use the hook without the dollar sign and provide an early return when status different than success to prevent reach a non populated query"
    )
  }
  return result.data
}
