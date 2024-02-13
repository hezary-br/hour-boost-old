import { DashboardSteamAccountsList } from "@/components/layouts/DashboardSteamAccountsList"
import { HeaderDashboard } from "@/components/layouts/Header/header-dashboard"
import { UserPlanStatus } from "@/components/layouts/UserPlanStatus/component"
import { UserProvider } from "@/contexts/UserContext"
import { api } from "@/lib/axios"
import { UserSession } from "core"
import { GetServerSideProps, GetServerSidePropsContext, PreviewData } from "next"
import Head from "next/head"
import { ParsedUrlQuery } from "querystring"

type getUserPropsProps = {
  ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
}

export async function getUserProps({ ctx }: getUserPropsProps) {
  const { data: user } = await api.get<UserSession | null>("/me", {
    headers: ctx.req.headers as Record<string, string>,
  })

  if (!user) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: false,
      },
    }
  }

  return {
    props: {
      user,
    } as UserSessionParams,
  }
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const userProps = await getUserProps({ ctx })
  return userProps
}

type UserSessionParams = {
  user: UserSession
}

export default function DashboardPage({ user }: UserSessionParams) {
  return (
    <UserProvider serverUser={user}>
      <Head>
        <title>Hourboost - Painel</title>
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
      </Head>
      <HeaderDashboard />
      <div className="max-w-[1440px] w-full mx-auto mdx:px-8">
        <UserPlanStatus />
        <DashboardSteamAccountsList />
      </div>
    </UserProvider>
  )
}
