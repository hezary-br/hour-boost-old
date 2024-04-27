import dotenv from "dotenv"
dotenv.config()

async function main() {
  const headers = new Headers()
  headers.append("content-type", "application/json")
  const response = await fetch(process.env.STOP_ENDPOINT, {
    headers,
    method: "POST",
    body: `{"secret":"${process.env.SECRET}"}`,
  })
  if (!response.ok) {
    console.log(response)
    throw new Error("Failed to stop farm.")
  }
  const data = await response.json()
  console.log(data)
}

main()
