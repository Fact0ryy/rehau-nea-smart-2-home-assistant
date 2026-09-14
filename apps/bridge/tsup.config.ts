import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  target: "node24",
  banner: {
    js: 'import { dirname as bundleDirname } from "node:path"; import { fileURLToPath as bundleFileURLToPath } from "node:url"; import { createRequire as bundleCreateRequire } from "node:module"; const require = bundleCreateRequire(import.meta.url); const __filename = bundleFileURLToPath(import.meta.url); const __dirname = bundleDirname(__filename);',
  },
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  // Keep native/runtime-only dependencies external.
  external: ["@fastify/swagger-ui", "bcrypt", "pino-pretty"],
  // Runtime images install only the externals above, so all JavaScript
  // dependencies and workspace packages must be bundled.
  noExternal: [/^(?!@fastify\/swagger-ui$|bcrypt$|pino-pretty$).+/],
});
