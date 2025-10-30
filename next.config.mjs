/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Increase body size limit for audio file uploads (default is 4MB)
  // Set to 100MB to support longer recordings
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // Also configure for API routes
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      externals.push('utf-8-validate', 'bufferutil', 'encoding');
      config.externals = externals;
    } else {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        'utf-8-validate': false,
        bufferutil: false,
        encoding: false
      };
    }

    return config;
  }
};

export default nextConfig;
