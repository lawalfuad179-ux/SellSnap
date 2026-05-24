const nextConfig = {
  allowedDevOrigins: ['192.168.100.27'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000', '192.168.100.27:3000'],
    },
  },
};

export default nextConfig;
