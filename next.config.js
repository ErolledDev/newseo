/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export - this breaks API routes which are essential for the app
  // output: 'export', // REMOVED - breaks API functionality
  
  // Image optimization settings
  images: {
    unoptimized: true,
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      'kitaboo.com',
      'upload.wikimedia.org'
    ],
  },
  
  // Environment variable configuration
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  
  // Configure webpack for better optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    
    return config
  },
  
  // Configure headers for better SEO and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig