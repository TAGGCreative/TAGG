const localMediaPort = process.env.TAGG_LOCAL_MEDIA_PORT
const localMedia =
  /^\d{1,5}$/.test(localMediaPort || "") && !process.env.VERCEL_ENV

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: {
      displayName: true,
      ssr: true,
      fileName: true,
      meaninglessFileNames: ["index", "styles"],
      cssProp: true,
      minify: true,
      transpileTemplateLiterals: true,
    },
  },
  reactStrictMode: true,
  images: {
    unoptimized: Boolean(localMedia),
    formats: ["image/webp", "image/avif"],
    qualities: [65, 75],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.taggcreative.com",
        pathname: "/**",
      },
      ...(localMedia
        ? [
            {
              protocol: "http",
              hostname: "127.0.0.1",
              port: localMediaPort,
              pathname: "/videos/**",
            },
          ]
        : []),
    ],
  },
  async rewrites() {
    if (process.env.VERCEL_ENV !== "preview") return []
    return [
      {
        source: "/preview-video/:path+",
        destination: "https://media.taggcreative.com/videos/:path+",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
