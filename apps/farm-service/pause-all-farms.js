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
  const data = await response.json()
  console.log(data)
}

main()
