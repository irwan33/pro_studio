import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    /**
     * react-konva resolves konva's node entry point on the server, which drags in
     * the optional `canvas` native binding. The stage is client-only, so the
     * binary is stubbed out to keep webpack from trying to parse `canvas.node`.
     */
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false
    };
    return config;
  }
};

export default nextConfig;
