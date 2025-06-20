/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow access from any host (for local network access)
  experimental: {
    allowMiddlewareResponseBody: true,
  },
  // Ensure the app works when accessed via IP address
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
}

module.exports = nextConfig 