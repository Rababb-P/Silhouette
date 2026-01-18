/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Proxy API requests to the backend server
    // Backend runs on port 3001, frontend on 3000
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '3001'
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${backendPort}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
