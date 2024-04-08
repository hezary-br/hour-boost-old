import { HBHeaders } from "@hourboost/tokens"
import axios from "axios"
import cookie from "cookie"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use(async config => {
  const cookies = cookie.parse(document.cookie)
  config.headers[HBHeaders["hb-identification"]] = cookies[HBHeaders["hb-identification"]]
  return config
})
