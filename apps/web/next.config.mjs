/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multi-domain by hostname (D-056). See middleware.ts for the host → brand map.
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
