import { SignIn } from "@clerk/nextjs"

import { injectServerMeta } from "@/contexts/server-meta"
import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function Page() {
  return (
    <div className="grid min-h-screen place-items-center">
      <SignIn
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  )
}
