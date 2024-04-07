import { authMiddleware, redirectToSignIn } from "@clerk/nextjs"
import { NextFetchEvent, NextRequest, NextResponse } from "next/server"

export default function (req: NextRequest, event: NextFetchEvent) {
  return authMiddleware({
    publicRoutes: ["/"],
    afterAuth(auth, req) {
      const url = req.nextUrl.clone()
      if (req.nextUrl.pathname.startsWith("/admin")) {
        if (auth.sessionClaims?.metadata.role !== "ADMIN") {
          url.pathname = "/404"
          return NextResponse.rewrite(url)
        }
      }

      if (!auth.userId && !auth.isPublicRoute) {
        return redirectToSignIn({ returnBackUrl: req.url })
      }

      return NextResponse.next()
    },
  })(req, event)
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
