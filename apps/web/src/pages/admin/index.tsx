import { HeaderDashboard } from "@/components/layouts/Header/header-dashboard"
import { AdminUserListContent } from "@/components/layouts/pages/admin/components/AdminUserListContent"
import { api } from "@/lib/axios"
import { getUserSession } from "@/server-fetch/getUserSession"
import { UserSessionParams } from "@/server-fetch/types"
import { generateNextCommand } from "@/util/generateNextCommand"
import { getAuth } from "@clerk/nextjs/server"
import { GetServerSidePropsContext } from "next"
import { useSyncExternalStore } from "react"

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { getToken, sessionClaims } = getAuth(ctx.req)
  console.log({ sessionClaims })

  const [error, userResponse] = await getUserSession({ getToken })
  if (error) throw error
  const { data, headers } = userResponse

  if (headers["set-cookie"]) {
    ctx.res.setHeader("set-cookie", headers["set-cookie"])
  }

  return generateNextCommand({
    subject: {
      user: data?.userSession ?? null,
      serverHeaders: data?.headers ?? null,
    },
    options: {
      shouldShowNotFoundPageWhen({ user }) {
        return user?.role !== "ADMIN"
      },
    },
  })
}

export default function AdminDashboard({ serverHeaders }: UserSessionParams) {
  for (const headerName in serverHeaders) {
    api.defaults.headers.common[headerName] = serverHeaders[headerName]
  }

  return (
    <>
      <HeaderDashboard />
      <div className="mdx:px-8 mx-auto w-full max-w-[1440px] overflow-hidden">
        <AdminUserListContent />
      </div>
    </>
  )
}

type BrowserBoundaryProps = {
  children?: React.ReactNode | undefined
  fallback: React.ReactNode
}

export function BrowserBoundary({ fallback, children }: BrowserBoundaryProps) {
  const isSSR = useSyncExternalStore(
    () => () => {},
    () => false,
    () => true
  )
  if (isSSR) return fallback

  return children
}
