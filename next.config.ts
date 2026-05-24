const nextConfig = {
  allowedDevOrigins: ['192.168.100.27'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000', '192.168.100.27:3000'],
    },
  },
  async headers() {
    return [
      {
        source: '/(favicon\\.png|logo\\.png)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
