import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@erptry/ui', '@erptry/contracts', '@erptry/domain']
};

export default nextConfig;
