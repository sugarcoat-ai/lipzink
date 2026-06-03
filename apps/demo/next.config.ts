import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Consume the workspace packages straight from their TypeScript source (their
  // exports point at src/), so the demo dogfoods them with no build step in dev.
  transpilePackages: ["@avatalk/mouth", "@avatalk/avatar"],
}

export default nextConfig
