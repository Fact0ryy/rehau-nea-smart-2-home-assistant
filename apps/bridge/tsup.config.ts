import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  target: "node24",
  banner: {
    js: 'import { dirname } from "node:path"; import { fileURLToPath } from "node:url"; import { createRequire } from "node:module"; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);',
  },
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  // Keep native/runtime-only dependencies external.
  external: ["bcrypt", "pino-pretty"],
  // Runtime images install only the externals above, so all JavaScript
  // dependencies and workspace packages must be bundled.
  noExternal: [/^(?!bcrypt$|pino-pretty$).+/],
});
