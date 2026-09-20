/** @type {import('next').NextConfig} */
const nextConfig = {
  // FitForge — Server-rendered Next.js 14 App Router (not static export)
  reactStrictMode: true,

  // Required for Docker: bundles only what's needed to run the server.
  // Reduces the final Docker image from ~1 GB to ~200 MB.
  output: "standalone",

  // Compress responses for faster delivery
  compress: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental: optimize package imports for smaller bundle
  experimental: {
    optimizePackageImports: ["framer-motion", "@supabase/ssr"],
  },

  // HTTP security headers (applied globally)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enforce HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy (no unnecessary browser APIs)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Long-lived cache for static frames (1 year)
        source: "/frames/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
