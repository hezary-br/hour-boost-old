import { Accordion } from "@/components/ui/accordion"
import { useUserAdminList } from "../hooks/useUserAdminList"
import { UserAdminItemListItem } from "./AdminUserItemListItem"

type PendingProps = {
  isPending: boolean
}

export function UserAdminItemList({ isPending }: PendingProps) {
  const usersInfo = useUserAdminList({
    select: userList => userList.map(user => `${user.id_user}::${user.steamAccounts.length}`),
  })
  const userIdListHasAccounts = useUserAdminList({
    select: userList => userList.filter(user => user.steamAccounts.length).map(user => user.id_user),
  })

  if (usersInfo.status !== "success" || userIdListHasAccounts.status !== "success") {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[10.75rem] animate-pulse bg-slate-900/50"
          />
        ))}
      </div>
    )
  }

  const usersInfoTuples = usersInfo.data.map(user => {
    const [userId, accountsAmount] = user.split("::")
    return { userId, accountsAmount: parseInt(accountsAmount) }
  })

  const shownUserIdList = [...usersInfoTuples]
    .sort((a, b) => b.accountsAmount - a.accountsAmount)
    .map(info => info.userId)

  return (
    <Accordion
      type="multiple"
      defaultValue={userIdListHasAccounts.data}
      className={isPending ? "opacity-50" : "opacity-100"}
    >
      {shownUserIdList.map(userId => (
        <UserAdminItemListItem
          userId={userId}
          key={userId}
        />
      ))}
    </Accordion>
  )
}

UserAdminItemList.displayName = "UserAdminItemList"
