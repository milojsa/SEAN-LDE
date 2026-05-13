/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  turbopack: {
    // Turbopack config for Next.js 16+
    // fabric.js should work with defaults
  },
};

module.exports = nextConfig;
