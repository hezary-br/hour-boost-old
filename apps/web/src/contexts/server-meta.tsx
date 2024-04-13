import { t } from "@/lib/token-factory"
import { GetServerSideProps, GetServerSidePropsContext } from "next"
import { createContext, useContext } from "react"
import z from "zod"

type ServerMetaProviderProps = {
  serverMeta: unknown
  children?: React.ReactNode | undefined
}

const ServerMetaContext = createContext<IServerMeta | null>(null)

const serverMetaSchema = z
  .object({
    session: z
      .object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN"]),
      })
      .strict()
      .nullable(),
  })
  .strict()
  .nullable()
type IServerMeta = z.infer<typeof serverMetaSchema>

export function ServerMetaProvider({ serverMeta, children }: ServerMetaProviderProps) {
  const parsedServerMeta = serverMetaSchema.parse(serverMeta ?? null)
  return <ServerMetaContext.Provider value={parsedServerMeta}>{children}</ServerMetaContext.Provider>
}

export const useServerMeta = () => {
  const context = useContext(ServerMetaContext)
  // if (!context) throw new Error("Tentativa de usar o contexto de serverMeta sem provider.")
  return context
}

function createServerMeta(request: GetServerSidePropsContext["req"]): IServerMeta {
  let session: NonNullable<IServerMeta>["session"] = null
  const hbIdentificationCookieString = request.cookies["hb-identification"]
  if (hbIdentificationCookieString) {
    const [error, token] = t.parseHBIdentification(hbIdentificationCookieString)
    if (token) {
      session = {
        role: token.role,
        userId: token.userId,
      }
    }
  }
  return {
    session,
  }
}

export const injectServerMeta =
  (routeServerSidePropsFn?: GetServerSideProps) => async (ctx: GetServerSidePropsContext) => {
    const serverMeta = { serverMeta: createServerMeta(ctx.req) }
    if (!routeServerSidePropsFn) {
      return new Promise<{ props: typeof serverMeta }>(resolve => resolve({ props: serverMeta }))
    }
    const res = await routeServerSidePropsFn(ctx)
    if ("props" in res) {
      res.props = { ...res.props, ...serverMeta }
    }
    return res
  }
