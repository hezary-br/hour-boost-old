import { t } from "@/lib/token-factory"
import { authMiddleware, clerkClient } from "@clerk/nextjs"
import { HBHeaders, HBIdentification } from "@hourboost/tokens"
import { NextFetchEvent, NextRequest, NextResponse } from "next/server"

export default function (req: NextRequest, event: NextFetchEvent) {
  return authMiddleware({
    ignoredRoutes: ["/"],
    publicRoutes: ["/home"],
    async afterAuth(auth, req) {
      const url = req.nextUrl.clone()
      const response = NextResponse.rewrite(url)
      const isMaintance = process.env["NEXT_PUBLIC_MAINTANCE"] === "true"

      if (pageHelpers.includes(url.pathname)) {
        url.pathname = "/404"
        return NextResponse.rewrite(url, response)
      }

      if (isMaintance) {
        if (auth.sessionId) {
          await clerkClient.sessions.revokeSession(auth.sessionId)
        }
        if (!auth.isPublicRoute) {
          url.pathname = "/maintance"
          return NextResponse.rewrite(url, response)
        }
      }

      if (!auth.userId) {
        response.cookies.delete(HBHeaders["hb-identification"])
        if (auth.isPublicRoute) return response
        response.headers.set("Location", validateURL(new URL("/sign-in", req.url)))
        return new NextResponse(null, {
          ...response,
          headers: response.headers,
          status,
        })
        // return redirectToSignIn({
        //   returnBackUrl: req.url,
        // })
      }

      let userToken: HBIdentification | null = null
      try {
        const token = await auth.getToken()
        const headers = new Headers()
        headers.set("Authorization", `Bearer ${token}`)

        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}me`, {
          method: "HEAD",
          headers,
        })

        const hbIdentificationToken = tokenResponse.headers.get(HBHeaders["hb-identification"])
        const hbHasID = tokenResponse.headers.get(HBHeaders["hb-has-id"])

        if (hbIdentificationToken) {
          response.cookies.set(HBHeaders["hb-identification"], hbIdentificationToken)
          const [error, hbIdentification] = t.parseHBIdentification(hbIdentificationToken)
          if (error) return NextResponse.redirect("/")
          userToken = hbIdentification
        }

        if (req.nextUrl.pathname.startsWith("/admin")) {
          // if (auth.sessionClaims?.metadata.role !== "ADMIN") {
          console.log({ userToken })
          if (!userToken || userToken.role !== "ADMIN") {
            url.pathname = "/404"
            return NextResponse.rewrite(url, response)
          }
        }

        return response
      } catch (e) {
        url.pathname = "/error"
        return NextResponse.rewrite(url, response)
      }
    },
  })(req, event)
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

const pageHelpers = ["/maintance", "/error"]

export function validateURL(url: string | URL): string {
  try {
    return String(new URL(String(url)))
  } catch (error: any) {
    throw new Error(
      `URL is malformed "${String(
        url
      )}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`,
      { cause: error }
    )
  }
}
