import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // hashit-web is meant to be reached from other machines on the LAN. Next 16
  // blocks cross-origin requests to dev resources (`/_next/*`) by default; when
  // the app is opened via anything other than "localhost" (a LAN IP, or even
  // 127.0.0.1) that block stops client chunks from loading, so the page renders
  // but never hydrates. Allow loopback plus the local private subnets here.
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
