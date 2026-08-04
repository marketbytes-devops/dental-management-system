/** @type {import('next').NextConfig} */
const nextConfig = {
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
