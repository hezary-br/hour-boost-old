import { Head, Html, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html
      className="scroll-smooth"
      lang="en"
    >
      <Head>
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
      </Head>

      <body>
        <Main />
        <NextScript />
        <div id="portal" />
      </body>
    </Html>
  )
}
