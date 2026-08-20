import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output produces a minimal, self-contained server bundle
  // (only the node_modules actually used at runtime) — required for a lean
  // production Docker image; see apps/frontend/Dockerfile.
  output: "standalone",
};

export default nextConfig;
