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
      // Add your image domains here
    ],
    unoptimized: false, // Set to true if you want to disable image optimization
  },
  
  // Experimental features
  experimental: {
    // Enable if you want to use app directory features
    appDir: true,
  },
  
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
  
  // Headers (optional)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
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
    ];
  },
};

module.exports = nextConfig; 