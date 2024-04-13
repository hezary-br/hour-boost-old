import { SVGDiscord } from "@/components/layouts/Footer"
import { ButtonPrimary } from "@/components/theme/button-primary"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import React from "react"

import { injectServerMeta } from "@/contexts/server-meta"
import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = injectServerMeta()

export default function ResourceNotFoundPage() {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "50rem",
          height: "32rem",
          WebkitMaskImage: "radial-gradient(black 46%, transparent 68%)",
          opacity: "0.3",
          mixBlendMode: "luminosity",
        }}
      >
        <img
          src="https://www.10wallpaper.com/wallpaper/medium/1110/call_of_duty_modern_warfare_3_HD_Game_wallpaper_20_medium.jpg"
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
      <div className="xs:scale-100 flex scale-[0.9] flex-col px-8">
        <div className="relative h-fit font-extrabold leading-none">
          <div className="flex justify-between">
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: "easeInOut", duration: 0.7 }}
              className="block text-center text-[2.5rem] sm:text-left sm:text-[4rem]"
            >
              Em desenvolvimento...
            </motion.span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:pt-8">
          {/* <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, ease: "easeInOut" }}
            className="leading-none text-slate-300 block font-normal text-[1rem] sm:text-[1.5rem]"
          >
            Entre em contato
          </motion.span> */}
          <ButtonPrimary
            asChild
            className="w-fit items-center"
          >
            <Link
              target="_blank"
              href="https://discord.com/invite/ZMknxzWCBW"
            >
              <span className="font-normal text-neutral-300">Entre em contato</span>
              <SVGDiscord className="shrink-0" />
              <span>Discord</span>
            </Link>
          </ButtonPrimary>
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
