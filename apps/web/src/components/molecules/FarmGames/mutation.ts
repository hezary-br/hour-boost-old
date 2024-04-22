import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosInstance } from "axios"
import { FarmGamesPayload } from "./controller"
import { httpFarmGames } from "./httpRequest"

export function useFarmGamesMutation(getApi: () => Promise<AxiosInstance>) {
  const queryClient = useQueryClient()
  return useMutation<void, DefaultError, FarmGamesPayload>({
    mutationFn: async (...args) => httpFarmGames(...args, getApi),
    onSettled() {
      queryClient.invalidateQueries()
    },
  })
}

export type FarmGamesMutationResult = ReturnType<typeof useFarmGamesMutation>
