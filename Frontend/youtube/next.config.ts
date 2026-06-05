import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler is disabled: it is App Router only and causes
  // "Cannot read properties of null (reading 'useInsertionEffect')"
  // when used with the Pages Router.
  // reactCompiler: true,
  reactStrictMode: true,
};

export default nextConfig;
