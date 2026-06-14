import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    const immutableAssetHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ]
    const edgePageHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    ]

    return [
      {
        source: "/",
        headers: edgePageHeaders,
      },
      {
        source: "/:locale(es|ru|de|fr|ja|ko|zh|th|hi)",
        headers: edgePageHeaders,
      },
      {
        source: "/changelog.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/flags/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/favicon/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/:asset(logo\\.svg|og-card\\.png|brave-logo\\.svg|ublock-logo\\.svg)",
        headers: immutableAssetHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: true,
        locale: false,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: true,
        locale: false,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.parrotplayer.site",
          },
        ],
        destination: "https://parrotplayer.site/:path*",
        permanent: true,
        locale: false,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
