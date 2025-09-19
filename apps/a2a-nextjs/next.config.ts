import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@agentarea/core', '@agentarea/react', '@agentarea/styles'],
};

export default nextConfig;
