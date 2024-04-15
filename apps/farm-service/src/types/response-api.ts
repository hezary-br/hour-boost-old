import { CookieOptions } from "express"

export interface ResponseAPI {
  status: number
  json?: Record<string, any>
  headers?: Header[]
  cookies?: Cookie[]
}

export type Header = {
  name: string
  value: string | string[]
}

export type Cookie = {
  name: string
  value: string
  options: CookieOptions
}

export function createResponse(
  status: number,
  json?: Record<string, any>,
  headers?: Header[],
  cookies?: Cookie[]
): ResponseAPI {
  return {
    status,
    cookies,
    headers,
    json,
  }
}

//prettier-ignore
export function createResponseNoJSON(
  status: number,
  headers?: Header[],
  cookies?: Cookie[]
): ResponseAPI {
  return {
    status,
    cookies,
    headers,
  }
}

export function createResponseCookies(
  status: number,
  json?: Record<string, any>,
  cookies?: Cookie[],
  headers?: Header[]
): ResponseAPI {
  return {
    status,
    cookies,
    headers,
    json,
  }
}

export function createResponseCookiesNoJSON(
  status: number,
  cookies?: Cookie[],
  headers?: Header[]
): ResponseAPI {
  return {
    status,
    cookies,
    headers,
  }
}

export function createCookie(name: string, value: string, options?: CookieOptions): Cookie {
  return {
    name,
    value,
    options: options ?? {},
  }
}
