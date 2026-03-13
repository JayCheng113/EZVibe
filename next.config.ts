import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { dir }) => {
    config.resolve.alias['@'] = path.join(dir, 'src');
    return config;
  },
};

export default nextConfig;
