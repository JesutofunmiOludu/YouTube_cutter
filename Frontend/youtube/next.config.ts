import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler is disabled: it is App Router only and causes
  // "Cannot read properties of null (reading 'useInsertionEffect')"
  // when used with the Pages Router.
  // reactCompiler: true,

  // Strict Mode is disabled in dev: it double-invokes effects and renders
  // which caused page freezes when clicking buttons on the landing page.
  // Re-enable in production builds only if desired.
  reactStrictMode: false,

  turbopack: {
    // Fix: Next.js was confused about root dir because there are two
    // package-lock.json files (Frontend/ and Frontend/youtube/).
    root: __dirname,
  },
};

export default nextConfig;
