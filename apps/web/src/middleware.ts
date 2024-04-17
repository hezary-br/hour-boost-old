import { PAGE_HELPERS } from "@/consts"
import { t } from "@/lib/token-factory"
import { appendResponseCookiesToRequest, setCookiesToResponse } from "@/util/cookie-helpers"
import { devlog } from "@/util/devlog"
import { validateURL } from "@/util/validate-url"
import { authMiddleware, clerkClient, redirectToSignIn } from "@clerk/nextjs"
import { HBHeaders, HBIdentification } from "@hourboost/tokens"
import { NextResponse } from "next/server"

export default authMiddleware({
  ignoredRoutes: ["/"],
  publicRoutes: ["/home"],
  async afterAuth(auth, req) {
    let hbIdentificationToken: string | null = null
    let hbHasId: string | null = null
    let hbHasUser: string | null = null

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

      appendResponseCookiesToRequest(req, response)
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

      hbIdentificationToken = tokenResponse.headers.get(HBHeaders["hb-identification"])
      hbHasUser = tokenResponse.headers.get(HBHeaders["hb-has-user"])
      hbHasId = tokenResponse.headers.get(HBHeaders["hb-has-id"])

      const userIdHasUser = hbHasUser === "true"
      if (!userIdHasUser) {
        const createMeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/create-me`, {
          method: "POST",
          headers,
        })

        hbIdentificationToken = createMeResponse.headers.get(HBHeaders["hb-identification"])
        hbHasUser = createMeResponse.headers.get(HBHeaders["hb-has-user"])
        hbHasId = createMeResponse.headers.get(HBHeaders["hb-has-id"])
      }

      if (hbIdentificationToken) {
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

      console.log({
        "userToken?.status": userToken?.status, "auth.isPublicRoute": auth.isPublicRoute
      })
      if (userToken?.status === "BANNED" && !auth.isPublicRoute) {
        setCookiesToResponse(response, [
          ["hb-user-banned", "true"],
          [HBHeaders["hb-identification"], hbIdentificationToken],
          [HBHeaders["hb-has-user"], hbHasUser],
          [HBHeaders["hb-has-id"], hbHasId],
        ])
        const headers = new Headers()
        // for (const cookie of response.headers.getSetCookie()) {
        //   // if(cookie.startsWith(HBHeaders["hb-identification"])) continue
        //   headers.append("set-cookie", cookie)
        // }
        const url = new URL("/home", req.url)
        url.searchParams.append("banned", "true")
        console.log(response.headers.getSetCookie())
        const response2 = new NextResponse(null, {
          ...response,
          headers: response.headers,
          status: 307,
        })
        response2.headers.set("Location", validateURL(url))
        setCookiesToResponse(response2, [
          ["hb-user-banned", "true"],
          [HBHeaders["hb-identification"], hbIdentificationToken],
          [HBHeaders["hb-has-user"], hbHasUser],
          [HBHeaders["hb-has-id"], hbHasId],
        ])
        // response2.cookies.set("hb-user-banned", "true")
        // if (hbIdentificationToken)
        //   response2.cookies.set(HBHeaders["hb-identification"], hbIdentificationToken)
        // if (hbHasUser) response2.cookies.set(HBHeaders["hb-has-user"], hbHasUser)
        // if (hbHasId) response2.cookies.set(HBHeaders["hb-has-id"], hbHasId)
        // console.log({
        //   hbIdentificationToken,
        //   hbHasUser,
        //   hbHasId,
        // })
        devlog("[MIDDLEWARE]: Banido, redirecionando para home.")
        return response2
      }

      setCookiesToResponse(response, [
        [HBHeaders["hb-identification"], hbIdentificationToken],
        [HBHeaders["hb-has-user"], hbHasUser],
        [HBHeaders["hb-has-id"], hbHasId],
      ])
      appendResponseCookiesToRequest(req, response)
      devlog("[MIDDLEWARE]: Next!")
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
