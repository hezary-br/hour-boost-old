import { cubicBezier, motion } from "framer-motion"
import Image from "next/image"

export default function Maintance() {
  return (
    <main className="grid h-screen place-items-center">
      <div className="flex flex-col items-center">
        <Image
          alt=""
          src="/broken-robot.png"
          className="translate-x-8"
          width={400}
          height={400}
        />
        <motion.h2
          initial={{
            y: 40,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            delay: 0.3,
            duration: 1,
            ease: cubicBezier(0.1, 0.5, 0.5, 1),
          }}
          className="mt-8 text-center text-6xl font-bold"
        >
          Servidor em <br />
          manutenção!
        </motion.h2>
      </div>
    </main>
  )
}
