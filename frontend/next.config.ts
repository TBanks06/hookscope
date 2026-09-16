import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal server for the Docker runner (see Dockerfile)
  output: "standalone",
};

export default nextConfig;
