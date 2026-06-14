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
