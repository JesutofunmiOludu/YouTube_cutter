import type { NextConfig } from "next";
import path from "path";

const rootDir = path.resolve(__dirname);
const nm = path.join(rootDir, "node_modules");

const nextConfig: NextConfig = {
  reactStrictMode: false,

  turbopack: { root: rootDir },

  webpack: (config) => {
    config.context = rootDir;
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.join(nm, "react"),
      "react-dom": path.join(nm, "react-dom"),
      "next/router": path.join(nm, "next/router"),
      "next/navigation": path.join(nm, "next/navigation"),
      "next/dist/shared/lib/router-context.shared-runtime":
        path.join(nm, "next/dist/shared/lib/router-context.shared-runtime.js"),
      "next/dist/shared/lib/router-context":
        path.join(nm, "next/dist/shared/lib/router-context.js"),
      "next/dist/client/router":
        path.join(nm, "next/dist/client/router.js"),
    };
    return config;
  },
};

export default nextConfig;
