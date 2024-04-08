"use client"
import { Toaster } from "@/components/ui/sonner"
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

import { useMediaQuery } from "@/components/hooks"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Head from "next/head"
import { PropsWithChildren, useState, useSyncExternalStore } from "react"
import { useIsomorphicLayoutEffect } from "react-use"

export default function App({ Component, pageProps }: AppProps) {
  const isLessDesktop = useMediaQuery("(max-width: 896px)")
  const [queryClient] = useState(() => new QueryClient())

  useIsomorphicLayoutEffect(() => {
    document.body.style.setProperty("--font-family", barlow.style.fontFamily)
    document.body.className = cn(barlow.className, barlow.variable)
  }, [])

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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <main className={cn(barlow.className, barlow.variable)}>
            <QueryClientProvider client={queryClient}>
              <Component {...pageProps} />
              <ReactQueryDevtools
                initialIsOpen={true}
                buttonPosition="bottom-left"
              />
            </QueryClientProvider>
            <Analytics />
          </main>
          {isLessDesktop && <Toaster position="top-center" />}
          {!isLessDesktop && <Toaster position="bottom-left" />}
        </ThemeProvider>
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
