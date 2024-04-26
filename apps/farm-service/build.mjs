import { build } from "esbuild"

const ESM_REQUIRE_SHIM = `
await (async () => {
  const { dirname } = await import("path");
  const { fileURLToPath } = await import("url");

  /**
   * Shim entry-point related paths.
   */
  if (typeof globalThis.__filename === "undefined") {
    globalThis.__filename = fileURLToPath(import.meta.url);
  }
  if (typeof globalThis.__dirname === "undefined") {
    globalThis.__dirname = dirname(globalThis.__filename);
  }
  /**
   * Shim require if needed.
   */
  if (typeof globalThis.require === "undefined") {
    const { default: module } = await import("module");
    globalThis.require = module.createRequire(import.meta.url);
  }
})();
`

const shimBanner = {
  js: ESM_REQUIRE_SHIM,
}

/**
 * ESNext + ESM, bundle: true, and require() shim in banner.
 */
async function main() {
  const foundJSON = await import("./package.json", {
    assert: {
      type: "json",
    },
  })

  const {
    default: { dependencies = {}, peerDependencies = {} },
  } = foundJSON

  const nonInternalHourbostDeps = Object.entries(dependencies).reduce((acc, [dep, version]) => {
    if (version === "workspace:*") {
      console.log("Excluding: ", dep)
      return acc
    }
    acc.push(dep)
    return acc
  }, [])

  const common = {
    entryPoints: ["src/server.ts"],
    external: nonInternalHourbostDeps,
  }

  const buildOptions = {
    ...common,
    format: "esm",
    target: "esnext", // <- required
    platform: "node",
    banner: shimBanner,
    outfile: "dist/server.js",
    // external: ["esnext"], // <- i may need
    bundle: true,
  }

  build(buildOptions)
}

main()
