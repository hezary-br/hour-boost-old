import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/router"
import React from "react"

export default function ResourceNotFoundPage() {
  const router = useRouter()

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden">
      <header className="absolute left-0 right-0 top-0 z-20 flex h-10 items-center">
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 md:px-8">
          <div className="flex flex-1 items-center md:hidden">
            <div className="relative">
              <div className="absolute inset-0" />
              <button
                onClick={() => router.back()}
                className="relative grid h-8 w-8 place-items-center hover:bg-slate-950/40"
              >
                <SVGArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* <div className="grow flex justify-center items-center">
            <img
              src="logo.png"
              alt=""
              className="h-[1.7rem]"
            />
          </div> */}
          <div className="flex flex-1 items-center justify-end md:hidden">
            <Link
              href="/"
              className="grid h-8 w-8 place-items-center hover:bg-slate-950/40"
            >
              <SVGHome className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      <div
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70rem",
          height: "37rem",
          WebkitMaskImage: "radial-gradient(black 46%, transparent 68%)",
          opacity: "0.5",
          mixBlendMode: "luminosity",
        }}
      >
        <img
          src="/fada.webp"
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            width: "100%",
            display: "block",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="relative flex h-[30rem] w-full max-w-[40rem] flex-col">
        <div className="hidden justify-between pb-6 md:flex">
          <Button
            onClick={() => router.back()}
            size="sm"
            className="group relative border border-slate-500 bg-slate-950 text-slate-200 transition-all duration-200 hover:border-white hover:bg-black hover:pl-10 hover:text-white"
          >
            <SVGArrowLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
            <span>Voltar</span>
          </Button>
          <Button
            onClick={() => router.back()}
            size="sm"
            className="group relative border border-slate-500 bg-slate-950 text-slate-200 transition-all duration-200 hover:border-white hover:bg-black hover:pr-10 hover:text-white"
            asChild
          >
            <Link href="/">
              <SVGArrowLeft className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-2 rotate-180 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
              <span>Home</span>
            </Link>
          </Button>
        </div>
        <div className="grid h-full place-items-center">
          <div className="xs:scale-100 flex scale-[0.9] flex-col">
            <div className="relative h-fit text-[7rem] font-extrabold leading-none">
              <div className="flex justify-between">
                {["4", "0", "4"].map((number, index) => (
                  <motion.span
                    key={`${number}-${index}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, ease: "easeInOut" }}
                    className="block pb-4"
                  >
                    {number}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                className="absolute top-0 h-1 w-full bg-white"
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, ease: "easeInOut" }}
              className="block text-[1.5rem] font-normal leading-none text-slate-300"
            >
              Página não encontrada!
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  )
}

export type SVGArrowLeftProps = React.ComponentPropsWithoutRef<"svg">

export function SVGArrowLeft({ className, ...props }: SVGArrowLeftProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      className={cn("", className)}
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <line
        x1={216}
        y1={128}
        x2={40}
        y2={128}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      <polyline
        points="112 56 40 128 112 200"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}

export type SVGHomeProps = React.ComponentPropsWithoutRef<"svg">

export function SVGHome({ className, ...props }: SVGHomeProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      className={cn("", className)}
    >
      <rect
        width={256}
        height={256}
        fill="none"
      />
      <path
        d="M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V115.54a8,8,0,0,1,2.62-5.92l80-75.54a8,8,0,0,1,10.77,0l80,75.54a8,8,0,0,1,2.62,5.92V208a8,8,0,0,1-8,8H160A8,8,0,0,1,152,208Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={24}
      />
    </svg>
  )
}
