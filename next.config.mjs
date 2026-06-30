/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    useWasmBinary: true,
  },
};

export default nextConfig;
