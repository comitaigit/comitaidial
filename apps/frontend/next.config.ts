import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Not using output: "standalone" — Next.js's output-file-tracing has a
  // known gap with pnpm's symlinked store that drops ESM-only runtime
  // files (e.g. @swc/helpers/esm/*), causing a MODULE_NOT_FOUND crash at
  // boot. apps/frontend/Dockerfile ships the full pruned node_modules
  // instead and runs `next start` directly, sidestepping the tracer.
};

export default nextConfig;
