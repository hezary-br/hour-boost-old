export function devlog(...args: any[]) {
  if (process.env.NODE_ENV === "development") console.log(...args)
}
