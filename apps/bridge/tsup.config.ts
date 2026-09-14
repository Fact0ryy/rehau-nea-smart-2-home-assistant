import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  target: "node24",
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
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
