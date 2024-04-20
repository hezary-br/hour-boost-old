import { IconSpinner } from "@/components/icons/IconSpinner"
import { Accordion } from "@/components/ui/accordion"
import twc from "tailwindcss/colors"
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
      <div className="flex h-[40rem] items-center justify-center gap-4">
        <div className="-scale-x-100">
          <IconSpinner
            color={twc["slate"]["600"]}
            className="size-24 animate-spin"
          />
        </div>
      </div>
    )
  }

  const usersInfoTuples = usersInfo.data.map(user => {
    const [userId, accountsAmount] = user.split("::")
    return { userId, accountsAmount: parseInt(accountsAmount) }
  })

  const shownUserIdList = [...usersInfoTuples]
    .sort((a, b) => (b.userId > a.userId ? 1 : b.userId > a.userId ? -1 : 0))
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
