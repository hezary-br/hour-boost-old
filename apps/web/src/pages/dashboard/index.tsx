import { DashboardSteamAccountsList } from "@/components/layouts/DashboardSteamAccountsList"
import { HeaderDashboard } from "@/components/layouts/Header/header-dashboard"
import { UserPlanStatus } from "@/components/layouts/UserPlanStatus/component"
import { ErrorBoundary } from "@/contexts/ERROR-BOUNDARY"
import { UserSession } from "core"
import Head from "next/head"

export type GetMeResponse = {
  code: "USER-SESSION::CREATED" | "USER-SESSION::FOUND"
  userSession: UserSession | null
  headers: {
    "hb-identification": string
  }
}

export default function DashboardPage() {
  return (
    <>
      <ErrorBoundary>
        <Head>
          <title>Hourboost - Painel</title>
          <link
            rel="shortcut icon"
            href="/favicon.ico"
          />
        </Head>
        <HeaderDashboard />
        <div className="mdx:px-8 mx-auto w-full max-w-[1440px]">
          <UserPlanStatus />
          {/* <Fallback /> */}
          <DashboardSteamAccountsList />
        </div>
      </ErrorBoundary>
    </>
  )
}
