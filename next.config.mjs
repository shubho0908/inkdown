/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  htmlLimitedBots: /.*/,
  images: {
    formats: ["image/webp"],
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.designfast.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/opengraph-image": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/twitter-image": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/view/*": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/view/*/opengraph-image": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/view/*/twitter-image": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/view/folder/*": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/view/folder/*/opengraph-image": ["./public/fonts/**/*", "./public/apple-icon.png"],
    "/view/folder/*/twitter-image": ["./public/fonts/**/*", "./public/apple-icon.png"],
  },
  async headers() {
    return [
      {
        source: "/view/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/sitemap",
      },
      {
        source: "/openapi.json",
        destination: "/openapi",
      },
    ];
  },
};

export default nextConfig;
