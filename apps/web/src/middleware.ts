import { PAGE_HELPERS } from "@/consts"
import { t } from "@/lib/token-factory"
import { applySetCookie } from "@/util/cookie-helpers"
import { devlog } from "@/util/devlog"
import { authMiddleware, clerkClient, redirectToSignIn } from "@clerk/nextjs"
import { HBHeaders, HBIdentification } from "@hourboost/tokens"
import { NextResponse } from "next/server"

export default authMiddleware({
  ignoredRoutes: ["/"],
  publicRoutes: ["/home"],
  async afterAuth(auth, req) {
    const url = req.nextUrl.clone()

    const response = NextResponse.rewrite(url)
    const isMaintance = process.env["NEXT_PUBLIC_MAINTANCE"] === "true"

    if (PAGE_HELPERS.includes(url.pathname)) {
      url.pathname = "/404"
      devlog("[MIDDLEWARE]: Tentou acessar paginas helpers, mostrando 404.")
      return NextResponse.rewrite(url, response)
    }

    if (isMaintance) {
      response.cookies.set(HBHeaders["hb-has-id"], "false")
      response.cookies.delete(HBHeaders["hb-identification"])
      if (auth.sessionId) {
        await clerkClient.sessions.revokeSession(auth.sessionId)
      }
      if (!auth.isPublicRoute) {
        url.pathname = "/maintance"
        devlog("[MIDDLEWARE]: Em manutenção.")
        return NextResponse.rewrite(url, response)
      }

      applySetCookie(req, response)
      return response
    }

    if (!auth.userId) {
      response.cookies.delete(HBHeaders["hb-identification"])
      if (!auth.isPublicRoute)
        return redirectToSignIn({
          returnBackUrl: req.url,
        })
    }

    let userToken: HBIdentification | null = null
    try {
      const token = await auth.getToken()
      const headers = new Headers()
      headers.set("Authorization", `Bearer ${token}`)

      const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/me`, {
        method: "HEAD",
        headers,
      })

      const hbIdentificationToken = tokenResponse.headers.get(HBHeaders["hb-identification"])
      const userIdHasUser = tokenResponse.headers.get(HBHeaders["hb-has-user"]) === "true"
      const hbHasId = tokenResponse.headers.get(HBHeaders["hb-has-id"])
      if (hbHasId) response.cookies.set(HBHeaders["hb-has-id"], hbHasId)
      if (!userIdHasUser) {
        const createMeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/create-me`, {
          method: "POST",
          headers,
        })

        const setCookieString = createMeResponse.headers.getSetCookie()
        response.headers.set("Set-Cookie", setCookieString.join(", "))
      }

      if (hbIdentificationToken) {
        response.cookies.set(HBHeaders["hb-identification"], hbIdentificationToken)
        const [error, hbIdentification] = t.parseHBIdentification(hbIdentificationToken)
        if (error) {
          devlog("[MIDDLEWARE]: Erro ao parsear cookie de identification.")
          return NextResponse.redirect("/")
        }
        userToken = hbIdentification
      }
      devlog("[MIDDLEWARE]: --> LOG: tem token: ", !!userToken)

      if (req.nextUrl.pathname.startsWith("/admin")) {
        // if (auth.sessionClaims?.metadata.role !== "ADMIN") {
        if (!userToken || userToken.role !== "ADMIN") {
          url.pathname = "/404"
          devlog("[MIDDLEWARE]: User tentou acessar admin sem ter role, mostrando 404")
          return NextResponse.rewrite(url, response)
        }
      }

      if (!auth.userId) {
        response.cookies.delete(HBHeaders["hb-identification"])
      }
      devlog("[MIDDLEWARE]: Next!")
      applySetCookie(req, response)
      return response
    } catch (e) {
      url.pathname = "/error"
      devlog("[MIDDLEWARE]: Caiu no catch!", e)
      return NextResponse.rewrite(url, response)
    }
  },
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
