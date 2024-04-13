const webpack = require("webpack")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["core", "@hourboost/tokens"],
  images: {
    // remotePatterns: ["cdn.akamai.steamstatic.com", "img.clerk.com"],
    domains: ["cdn.akamai.steamstatic.com", "img.clerk.com"],
  },
  // experimental: {
  //   swcPlugins: [["next-superjson-plugin", {}]],
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // webpack(config) {
  //   config.plugins.push(
  //     new webpack.IgnorePlugin({
  //       resourceRegExp: /^next\/(navigation|headers|compat\/router)$/,
  //     })
  //   )
  //   return config
  // },
  env: {
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAINTANCE: process.env.NEXT_PUBLIC_MAINTANCE,
  },
}

module.exports = nextConfig
