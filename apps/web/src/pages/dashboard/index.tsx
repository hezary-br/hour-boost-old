import { DashboardSteamAccountsList } from "@/components/layouts/DashboardSteamAccountsList"
import { HeaderDashboard } from "@/components/layouts/Header/header-dashboard"
import { UserPlanStatus } from "@/components/layouts/UserPlanStatus/component"
import { ErrorBoundary } from "@/contexts/ERROR-BOUNDARY"
import { injectServerMeta } from "@/contexts/server-meta"
import { PlanSubscribedDialog } from "@/pages/dashboard/PlanSubscribedDialog"
import { UserSession } from "core"
import { GetServerSideProps } from "next"
import Head from "next/head"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

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
          <PlanSubscribedDialog />
        </div>
      </ErrorBoundary>
    </>
  )
}
