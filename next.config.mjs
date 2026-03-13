import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { dir }) => {
    config.resolve.alias['@'] = path.join(dir, 'src');
    return config;
  },
};

export default nextConfig;
