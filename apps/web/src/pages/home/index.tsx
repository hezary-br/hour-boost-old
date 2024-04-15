import { FAQSection } from "@/components/layouts/FAQSection"
import { Footer } from "@/components/layouts/Footer"
import { GamesAvailableSection } from "@/components/layouts/GamesAvailable"
import { Header } from "@/components/layouts/Header"
import { HeroSection } from "@/components/layouts/Hero"
import { HowItWorksSection } from "@/components/layouts/HowItWorks"
import { PlanSection } from "@/components/layouts/PlansSection"
import { WhatWeOfferSection } from "@/components/layouts/WhatWeOffer"
import { MaintanceDisclousure } from "@/components/molecules/maintance-disclousure"
import { injectServerMeta } from "@/contexts/server-meta"
import { GetServerSideProps } from "next"
import Head from "next/head"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function Home() {
  return (
    <>
      <Head>
        <title>Hourboost - Home</title>
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
      </Head>
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <GamesAvailableSection />
      <WhatWeOfferSection />
      <PlanSection />
      <FAQSection />
      <Footer />
      <MaintanceDisclousure />
    </>
  )
}
