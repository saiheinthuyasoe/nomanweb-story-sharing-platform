const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Import the existing Next.js config
const nextConfig = require('./next.config.ts');

module.exports = withBundleAnalyzer({
  ...nextConfig,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Apply existing webpack config if it exists
    if (nextConfig.webpack) {
      config = nextConfig.webpack(config, { buildId, dev, isServer, defaultLoaders, webpack });
    }

    // Add bundle analyzer plugin for client-side bundles
    if (!isServer && process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../bundle-analysis/client.html',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: '../bundle-analysis/client-stats.json',
        })
      );
    }

    // Add bundle analyzer plugin for server-side bundles
    if (isServer && process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../bundle-analysis/server.html',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: '../bundle-analysis/server-stats.json',
        })
      );
    }

    return config;
  },
});