/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the build if env vars aren't set yet (Replit sets them at runtime)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pg', 'bcryptjs'],
};

module.exports = nextConfig;
