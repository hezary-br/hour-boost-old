import { SignUp } from "@clerk/nextjs"

import { injectServerMeta } from "@/contexts/server-meta"
import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function Page() {
  return (
    <div className="grid min-h-screen place-items-center">
      <SignUp
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  )
}
