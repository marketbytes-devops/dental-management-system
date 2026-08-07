/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "192.168.1.38",
    "192.168.1.38:3000",
    "192.168.1.38:8000",
    "localhost",
    "127.0.0.1"
  ],
  async redirects() {
    return [
      {
        source: "/expenses",
        destination: "/frontdesk/accountant/expenses",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
