import cookie from "cookie"
import { useRouter } from "next/router"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

type UserBannedToaster = {}

export function UserBannedToaster({}: UserBannedToaster) {
  const router = useRouter()
  const isBannedQuery = router.query["banned"] === "true"
  const cookies = "window" in globalThis ? cookie.parse(document.cookie) : {}
  const isBannedBrowserCookie = cookies["hb-user-banned"] === "true"

  const isBanned = !!isBannedBrowserCookie && isBannedQuery

  return isBanned ? <UserBannedToasterMessage /> : null
}

type UserBannedToasterMessage = {}

function UserBannedToasterMessage({}: UserBannedToasterMessage) {
  const done = useRef(false)
  useEffect(() => {
    setTimeout(() => {
      if (done.current) return
      toast.error("Você foi banido e está impedido de performar ações no site.", {
        position: "top-center",
        duration: 1000 * 10,
      })
      done.current = true
      document.cookie = "hb-user-banned=; Max-Age=0"
    }, 500)
  }, [])
  return null
}
