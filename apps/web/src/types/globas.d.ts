export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "ADMIN" | "USER"
    }
  }
}
