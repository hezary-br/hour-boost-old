import { useMutation, useQueryClient } from "@tanstack/react-query"

import { DataOrMessage, MessageMaker } from "@/util/DataOrMessage"
import { resolvePromiseToMessage } from "@/util/resolvePromiseToMessage"
import { AxiosInstance } from "axios"
import { API_GET_RefreshAccountGames, GameSession } from "core"

export type SuccessResponse = {
  message: string
  games: GameSession[]
}

export function useRefreshGamesMutation(getApi: () => Promise<AxiosInstance>) {
  const msg = new MessageMaker<"UNKNOWN">()
  const queryClient = useQueryClient()

  return useMutation<DataOrMessage<SuccessResponse, "UNKNOWN">, unknown, { accountName: string }>({
    async mutationFn({ accountName }) {
      const api = await getApi()
      const [error, response] = await resolvePromiseToMessage(
        api.get<API_GET_RefreshAccountGames>(`/refresh-games?accountName=${accountName}`).then(response => ({
          status: 200,
          data: {
            message: "Jogos atualizados!",
            games: response.data.games,
          },
        }))
      )
      if (error) {
        return [error]
      }
      if (response.status === 200) {
        return [
          null,
          {
            message: response.data.message,
            games: response.data.games,
          },
        ]
      }
      return [msg.new("Resposta desconhecida.", "info")]
    },
    onSettled() {
      queryClient.invalidateQueries()
    },
  })
}
