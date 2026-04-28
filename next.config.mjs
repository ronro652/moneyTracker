/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
