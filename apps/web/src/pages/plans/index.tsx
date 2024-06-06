import { TitleSection } from "@/components/atoms/TitleSection"
import { PlansCard } from "@/components/layouts/pages/plans/components/PlansCard"
import { injectServerMeta } from "@/contexts/server-meta"
import { GetServerSideProps } from "next"
import Head from "next/head"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function PlansPage() {
  return (
    <>
      <Head>
        <title>Hourboost - Planos</title>
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
      </Head>
      <main className="flex flex-col pt-16">
        <TitleSection className="grow pb-[4rem] text-center">Planos</TitleSection>
        <span className="block pt-16" />
        <PlansCard />
      </main>
    </>
  )
}
