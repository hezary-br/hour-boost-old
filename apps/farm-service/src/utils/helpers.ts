export type PrettifySoft<T> = { [K in keyof T]: T[K] } & unknown
export type PrettifyOneLevel<T> = {
  [K in keyof T]: T[K] extends object ? PrettifySoft<T[K]> : T[K]
} & unknown
export type PrettifyTwoLevel<T> = {
  [K in keyof T]: T[K] extends object ? PrettifyOneLevel<T[K]> : T[K]
} & unknown

export function only<const T = any>(result: T) {
  return result as Only<T>
}

export function bad<const T>(error: T) {
  return [error] as [T]
}

export function nice<const T = undefined>(result?: T) {
  return [null, result] as [null, T]
}

export type GetError<T extends (...args: any[]) => any> = T extends (...args: any) => Promise<infer PR>
  ? PR extends [infer E]
    ? NonNullable<E>
    : never
  : T extends (...args: any) => infer R
    ? R extends [infer E]
      ? NonNullable<E>
      : never
    : never

export type GetErrorByTuple<T> = T extends [infer E] ? E : never
export type GetResultByTuple<T> = T extends [null, infer R] ? R : never

export type GetResult<T extends (...args: any[]) => any> = T extends (...args: any) => Promise<infer PR>
  ? PR extends [null, infer Res]
    ? Res
    : never
  : T extends (...args: any) => infer R
    ? R extends [null, infer RFRes]
      ? RFRes
      : never
    : never

export type GetTuple<T extends (...args: any[]) => any> = T extends (...args: any) => Promise<infer R>
  ? R
  : never

export type Pretify<T> = T extends Record<string, unknown> ? { [K in keyof T]: Pretify<T[K]> } & unknown : T
export type Mutable<T> =
  T extends Record<string, unknown> ? { -readonly [K in keyof T]: Mutable<T[K]> } & unknown : T
export type Only<T extends any> = T extends Record<string, unknown> ? Pretify<Mutable<T>> : T
