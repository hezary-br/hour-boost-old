async function main() {
  const headers = new Headers()
  headers.append("content-type", "application/json")
  const response = await fetch(process.env.STOP_ENDPOINT, {
    headers,
    method: "POST",
    body: `{"secret":"${process.env.SECRET}"}`,
  })
  if (!response.ok) {
    if (response.statusText === "Bad Gateway") {
      return console.log("Server is not up :)")
    } else if(response.statusText === "Service Temporarily Unavailable") {
      return console.log("Server instance is probably booting :)")
    } else {
      console.log(response)
      throw new Error("Failed to stop farm.")
    }
  }
  const data = await response.json()
  console.log(data)
}

main()
