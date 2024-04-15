import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

// export const prisma = new PrismaClient({
//   log: [
//     {
//       emit: "event",
//       level: "error",
//     },
//     {
//       emit: "event",
//       level: "query",
//     },
//   ],
// })

// prisma.$on("query", async e => {
//   console.log(`${e.query} ${e.params}`)
// })

// prisma.$on("error", async e => {
//   console.log(`${e.timestamp} ${e.message} ${e.target}`)
// })
