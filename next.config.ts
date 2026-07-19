import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    if (isServer) {
      const prismaPath = path.resolve('src/backend/db/prisma.ts');
      config.externals.push(({ request }: { request?: string }, callback: Function) => {
        if (request && (request === '@/backend/db/prisma' || request.includes('backend/db/prisma'))) {
          return callback(null, `commonjs2 ${prismaPath}`);
        }
        callback();
      });
    }
    return config;
  },
};

export default nextConfig;
