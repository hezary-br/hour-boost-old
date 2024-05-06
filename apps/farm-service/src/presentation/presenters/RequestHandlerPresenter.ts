import { Response } from "express"
import { ResponseAPI } from "~/types/response-api"

export class RequestHandlerPresenter {
  static async handle(responseAPI: ResponseAPI, response: Response) {
    const { status, json, headers, cookies } = responseAPI

    headers?.forEach(header => {
      response.setHeader(header.name, header.value)
    })

    cookies?.forEach(cookie => {
      response.cookie(cookie.name, cookie.value, cookie.options)
    })

    response.statusCode = status
    return json ? response.json(json) : response.end()
  }
}
