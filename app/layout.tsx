import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://parrotplayer.site"),
  title: "YouTube Queue Player and Music Jukebox | ParrotPlayer",
  description:
    "ParrotPlayer is a free YouTube queue player and music jukebox for bars, parties, restaurants, and playlists on the fly, with autoplay, crossfade, history, drag-and-drop links, and local playlist memory.",
  applicationName: "ParrotPlayer",
  creator: "ParrotPlayer",
  publisher: "ParrotPlayer",
  category: "music",
  keywords: [
    "YouTube music player",
    "YouTube queue player",
    "YouTube jukebox",
    "music jukebox",
    "bar jukebox",
    "bar music player",
    "party jukebox player",
    "party music player",
    "restaurant jukebox",
    "Thailand bar music",
    "playlist on the fly",
    "crossfade music player",
    "drag and drop YouTube playlist",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "YouTube Queue Player and Music Jukebox | ParrotPlayer",
    description:
      "A free YouTube music jukebox for bars, parties, restaurants, and building playlists on the fly, with autoplay, crossfade, history, drag-and-drop links, and local playlist memory.",
    siteName: "ParrotPlayer",
    type: "website",
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "ParrotPlayer YouTube queue player and music jukebox",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Queue Player and Music Jukebox | ParrotPlayer",
    description:
      "A free YouTube music jukebox for bars, parties, restaurants, and building playlists on the fly, with autoplay, crossfade, history, drag-and-drop links, and local playlist memory.",
    images: [
      {
        url: "/og-card.png",
        alt: "ParrotPlayer YouTube queue player and music jukebox",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
    shortcut: "/favicon/favicon.ico",
  },
  manifest: "/favicon/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#1a1625",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-SSJVLZ66PC" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SSJVLZ66PC');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
