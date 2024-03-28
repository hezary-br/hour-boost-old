export const reducerNumberPositives =
  (defaultValue: number) => (prev: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "" ? defaultValue : parseInt(event.target.value)
    return event.target.value === "" ? "" : value < 0 ? prev : value
  }
