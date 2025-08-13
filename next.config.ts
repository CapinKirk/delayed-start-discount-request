import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/embed.js",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Powered-By", value: "por-chat" },
        ],
      },
    ];
  },
};

export default nextConfig;
