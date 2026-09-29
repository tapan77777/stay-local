import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "media.gettyimages.com" },
      { protocol: "https", hostname: "media.istockphoto.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "as2.ftcdn.net" },
      { protocol: "https", hostname: "imgcld.yatra.com" },
      { protocol: "https", hostname: "himtrek.co.in" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
