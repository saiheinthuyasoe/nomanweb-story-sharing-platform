import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'recharts'],
  },
  
  // Configure webpack for better code splitting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Split admin routes into separate chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          admin: {
            name: 'admin',
            test: /[\\/]app[\\/]admin[\\/]/,
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          adminComponents: {
            name: 'admin-components',
            test: /[\\/]components[\\/]admin[\\/]/,
            chunks: 'all',
            priority: 9,
            enforce: true,
          },
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|chart\.js|react-chartjs-2)[\\/]/,
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          editor: {
            name: 'editor',
            test: /[\\/]components[\\/]editor[\\/]/,
            chunks: 'all',
            priority: 7,
            enforce: true,
          },
        },
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
        }/:path*`,
      },
    ];
  },
};

export default nextConfig;
