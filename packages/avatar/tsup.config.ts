import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // React is a peer dep; @lipzink/mouth is a separate package consumers install.
  // The notion SVGs are inlined data-URL strings in parts.generated.ts, so they
  // bundle into the JS automatically (no asset loader needed).
  external: ["react", "react-dom", "@lipzink/mouth"],
  banner: { js: '"use client";' },
})
