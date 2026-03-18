import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow WebSocket upgrades for terminal
  experimental: {
    serverComponentsExternalPackages: ['ws', 'node-pty', 'dockerode'],
  },
  // CORS headers for mobile app
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig
