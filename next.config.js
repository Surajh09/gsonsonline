/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false, // Set to true to completely ignore ESLint during builds
    
    // Alternatively, you can specify directories to ignore
    // dirs: ['pages', 'utils'], // Only run ESLint on these directories
  },
  
  // Image optimization
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'example.com',
      // Add your domain here
      'gsonsonline.co.in', // Replace with your actual domain
      // Add your image domains here
    ],
    unoptimized: false, // Set to true if you want to disable image optimization
  },
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Redirects (optional)
  async redirects() {
    return [
      // Add redirects here if needed
    ];
  },
  
  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://gsonsonline.co.in' // Replace with your actual domain
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 