/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Move pg and bcryptjs to server-only to avoid bundling issues
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcryptjs'],
  },
  // Allow Replit's proxied dev domain for hot-reload
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN,
    process.env.REPLIT_DOMAINS,
  ].filter(Boolean),
};

module.exports = nextConfig;
