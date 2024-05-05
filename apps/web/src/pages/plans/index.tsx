import { TitleSection } from "@/components/atoms/TitleSection"
import { injectServerMeta } from "@/contexts/server-meta"
import { PlansCard } from "@/pages/plans/components/PlansCard"
import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function PlansPage() {
  return (
    <main className="flex flex-col pt-16">
      <TitleSection className="grow pb-[4rem] text-center">Planos</TitleSection>
      <span className="block pt-16" />
      <PlansCard />
    </main>
  )
}
