import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // React is a peer dep; never bundle it. wawa-lipsync stays bundled.
  external: ["react", "react-dom"],
  // Both the component and the hook are client-only; preserve the directive.
  banner: { js: '"use client";' },
})
