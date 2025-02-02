import { RequestCookies, ResponseCookie, ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies"
import { NextRequest, NextResponse } from "next/server"

export function onlyValidCookies(cookie: ResponseCookie): boolean {
  if (cookie.maxAge && cookie.maxAge > 0) return false
  if (typeof cookie.expires === "number" && cookie.expires > 0) return false
  if (cookie.expires instanceof Date && cookie.expires.getTime() <= 0) return false
  return true
}

export function appendResponseCookiesToRequest(req: NextRequest, res: NextResponse): void {
  const setCookies = new ResponseCookies(res.headers)
  const newReqHeaders = new Headers(req.headers)
  const newReqCookies = new RequestCookies(newReqHeaders)
  setCookies
    .getAll()
    .filter(onlyValidCookies)
    .forEach(cookie => newReqCookies.set(cookie))
  NextResponse.next({
    request: { headers: newReqHeaders },
  }).headers.forEach((value, key) => {
    if (key === "x-middleware-override-headers" || key.startsWith("x-middleware-request-")) {
      res.headers.set(key, value)
    }
  })
}

export function setCookiesToResponse(response: NextResponse, cookieList: Array<[string, string | null]>) {
  cookieList.forEach(([name, value]) => {
    if (!value) return
    response.cookies.set(name, value)
  })
}
