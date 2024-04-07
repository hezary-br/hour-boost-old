import React, { Suspense, useSyncExternalStore } from "react"

export type SuspenseClientProps = React.ComponentPropsWithoutRef<typeof Suspense>

export function SuspenseClient({ fallback, ...props }: SuspenseClientProps) {
  const isSSR = useSyncExternalStore(
    () => () => {},
    () => false,
    () => true
  )

  console.log({ isSSR })
  if (isSSR) {
    return fallback
  }

  return <Suspense {...props} />
}
