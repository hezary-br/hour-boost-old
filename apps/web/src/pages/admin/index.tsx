import { HeaderDashboard } from "@/components/layouts/Header/header-dashboard"
import { AdminUserListContent } from "@/components/layouts/pages/admin/components/AdminUserListContent"
import { injectServerMeta } from "@/contexts/server-meta"
import { GetServerSideProps } from "next"
import { useSyncExternalStore } from "react"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function AdminDashboard() {
  // for (const headerName in serverHeaders) {
  //   api.defaults.headers.common[headerName] = serverHeaders[headerName]
  // }

  return (
    <>
      <HeaderDashboard />
      <div className="mdx:px-8 mx-auto w-full max-w-[1440px] overflow-hidden pb-24">
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
