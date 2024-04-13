export function getDeleteManyCookiesString(cookieNames: string[]) {
  return cookieNames.map(name => `${name}=; Max-Age=0`).join(", ")
}