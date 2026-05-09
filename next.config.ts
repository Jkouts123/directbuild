import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Raise the Server Actions body limit so estimator submissions with
      // multiple compressed photo data URIs aren't rejected with the
      // default 1MB limit.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/fergusonslandscapes",
        destination: "/fergusons-landscaping",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
