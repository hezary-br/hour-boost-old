"use client"
import { barlow } from "@/fonts"
import { cn } from "@/lib/utils"
import "@/styles/globals.css"
import "@/styles/neon-fx.css"
import { ptBR } from "@clerk/localizations"
import { ClerkProvider } from "@clerk/nextjs"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from "next-themes"
import type { AppProps } from "next/app"

import { UserBannedToaster } from "@/components/molecules/user-banned-toaster"
import { Toaster } from "@/components/toaster"
import { ServerMetaProvider } from "@/contexts/server-meta"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Head from "next/head"
import { useRouter } from "next/router"
import { PropsWithChildren, useState, useSyncExternalStore } from "react"
import { useIsomorphicLayoutEffect } from "react-use"

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())
  const router = useRouter()
  useIsomorphicLayoutEffect(() => {
    document.body.style.setProperty("--font-family", barlow.style.fontFamily)
    document.body.className = cn(barlow.className, barlow.variable)
  }, [])

  const shouldRenderServerMeta = ![
    "/404",
    "/500",
    "/error",
    "/maintance",
    "/sign-in/[[...index]]",
    "/sign-up/[[...index]]",
  ].includes(router.pathname)

  return (
    <>
      <Head>
        <title>Hourboost</title>
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
      </Head>
      <ClerkProvider
        {...pageProps}
        localization={ptBR}
      >
        <ServerMetaProvider serverMeta={pageProps.serverMeta}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            <main className={cn(barlow.className, barlow.variable)}>
              <QueryClientProvider client={queryClient}>
                <Component {...pageProps} />
                <ReactQueryDevtools buttonPosition="bottom-left" />
              </QueryClientProvider>
              <Analytics />
              <UserBannedToaster />
            </main>
            <Toaster />
          </ThemeProvider>
        </ServerMetaProvider>
      </ClerkProvider>
    </>
  )
}

export function ClientOnly({ children }: PropsWithChildren) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  return isClient ? children : null
}

{
  /* <Head>
              <title>Hourboost</title>
              <link
                rel="shortcut icon"
                href="/favicon.ico"
              />
            </Head> */
}
