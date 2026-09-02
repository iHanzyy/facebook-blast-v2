import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/*": ["./playwright-data/**/*"],
  },
};

export default nextConfig;
