import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Silence workspace-root lockfile warning in monorepo environments
  outputFileTracingRoot: path.join(__dirname),

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
