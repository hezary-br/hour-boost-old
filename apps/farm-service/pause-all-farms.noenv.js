async function main() {
  const headers = new Headers()
  headers.append("content-type", "application/json")
  const response = await fetch(process.env.STOP_ENDPOINT, {
    headers,
    method: "POST",
    body: `{"secret":"${process.env.SECRET}"}`,
  })
  if (!response.ok) {
    switch (response.statusText) {
      case "Bad Gateway":
      case "Service Temporarily Unavailable":
      case "Gateway Time-out":
        console.log("Server instance is probably booting :)")
        break
      default:
        throw new Error("Failed to stop farm.")
    }
  }
  const data = response.ok ? await response.json() : "Not ok :/"
  console.log(data)
}

main()
