/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
