import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Resolve canonical NTFS casing on Windows to prevent module duplication
const rootDir = typeof fs.realpathSync?.native === 'function'
  ? fs.realpathSync.native(path.resolve(__dirname))
  : path.resolve(__dirname);

const nextConfig: NextConfig = {
  reactStrictMode: false,

  turbopack: { root: rootDir },

  webpack: (config) => {
    config.context = rootDir;
    return config;
  },
};

export default nextConfig;
