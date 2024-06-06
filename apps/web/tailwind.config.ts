import type { Config } from "tailwindcss"

const config: Config = {
  mode: "jit",
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        "2xs": "0.625rem",
      },
      screens: {
        xs: "480px",
        // => @media (min-width: 480px) { ... }
        mdx: "896px",
        // => @media (min-width: 896px) { ... }
      },
      fontFamily: {
        barlow: ["var(--barlow)"],
      },
      colors: {
        accent: {
          "50": "hsl(206, 100%, 97%)",
          "100": "hsl(206, 95%, 93%)",
          "200": "hsl(206, 97%, 87%)",
          "300": "hsl(204, 98%, 78%)",
          "400": "hsl(205, 95%, 68%)",
          "500": "hsl(209, 92%, 60%)",
          DEFAULT: "hsl(213, 84%, 55%)",
          "700": "hsl(217, 77%, 48%)",
          "800": "hsl(218, 72%, 40%)",
          "900": "hsl(216, 65%, 33%)",
          "950": "hsl(218, 57%, 21%)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        "accent-foreground": "hsl(var(--accent-foreground))",
        // accent: {
        //   DEFAULT: "hsl(var(--accent))",
        // },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          // @ts-ignore
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          // @ts-ignore
          to: { height: 0 },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: ".5",
          },
        },
        "spin-r": {
          to: {
            transform: "rotate(-360deg)",
          },
        },
        spin: {
          from: {
            transform: "rotate(0deg)",
          },
          to: {
            transform: "rotate(360deg)",
          },
        },
      },
      "ping-sm": {
        "75%, 100%": {
          transform: "scale(1.2)",
          opacity: "0",
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ping-sm": "ping-sm 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        "spin-r": "spin-r 1s linear infinite",
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
}
export default config
