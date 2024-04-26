"use client"
import "@/styles/globals.css"
import "@/styles/neon-fx.css"
import { createContext, useContext } from "react"
let [decodeToken, SignInButton, UserInfo] = [] as any[]

// pagina
export const getServerSideProps = async ({ req }) => {
  const authToken = req.cookies["Authorization"]
  const session = decodeToken(authToken)

  return { props: { session } }
}

// _app
const SessionContext = createContext(null)

export default function App({ Component, pageProps }) {
  return (
    <SessionContext.Provider value={pageProps.session}>
      <Component {...pageProps} />
    </SessionContext.Provider>
  )
}

// componente
export function Header() {
  const session = useContext(SessionContext)

  if (!session) {
    return <SignInButton />
  }

  return <UserInfo info={session} />
}
