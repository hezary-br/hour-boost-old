import { t } from "@/lib/token-factory"
import { authMiddleware, redirectToSignIn } from "@clerk/nextjs"
import { HBHeaders, HBIdentification } from "@hourboost/tokens"
import { NextFetchEvent, NextRequest, NextResponse } from "next/server"

export default function (req: NextRequest, event: NextFetchEvent) {
  return authMiddleware({
    ignoredRoutes: ["/"],
    publicRoutes: ["/home"],
    async afterAuth(auth, req) {
      let userToken: HBIdentification | null = null
      const token = await auth.getToken()
      const headers = new Headers()
      headers.set("Authorization", `Bearer ${token}`)

      const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}me`, {
        method: "HEAD",
        headers,
      })

      const url = req.nextUrl.clone()
      const response = NextResponse.rewrite(url)

      const hbIdentificationToken = tokenResponse.headers.get(HBHeaders["hb-identification"])
      const hbHasID = tokenResponse.headers.get(HBHeaders["hb-has-id"])
      const isLogged = hbHasID ? JSON.parse(hbHasID) : false

      if (!isLogged) {
        response.cookies.delete(HBHeaders["hb-identification"])
      }

      if (hbIdentificationToken) {
        response.cookies.set(HBHeaders["hb-identification"], hbIdentificationToken)
        const [error, hbIdentification] = t.parseHBIdentification(hbIdentificationToken)
        if (error) return NextResponse.redirect("/")
        userToken = hbIdentification
      }

      if (req.nextUrl.pathname.startsWith("/admin")) {
        // if (auth.sessionClaims?.metadata.role !== "ADMIN") {
        if (!userToken || userToken.role !== "ADMIN") {
          url.pathname = "/404"
          return NextResponse.rewrite(url, response)
        }
      }

      if (!auth.userId && !auth.isPublicRoute) {
        return redirectToSignIn({ returnBackUrl: req.url })
      }

      return response
    },
  })(req, event)
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
