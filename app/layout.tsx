import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

export const metadata: Metadata = {
  title: "Youtube Queue and Music Jukebox | Parrot Player",
  description:
    "Parrot Player is a YouTube music jukebox for bars, restaurants, and building playlists on the fly, with vinyl-style playback, autoplay, crossfade, history, and local playlist memory.",
  applicationName: "Parrot Player",
  keywords: [
    "YouTube music player",
    "music jukebox",
    "bar jukebox",
    "restaurant jukebox",
    "playlist on the fly",
    "YouTube queue player",
    "crossfade music player",
  ],
  openGraph: {
    title: "Youtube Queue and Music Jukebox | Parrot Player",
    description:
      "A YouTube music jukebox for bars, restaurants, and building playlists on the fly, with vinyl-style playback, autoplay, crossfade, history, and local playlist memory.",
    siteName: "Parrot Player",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Youtube Queue and Music Jukebox | Parrot Player",
    description:
      "A YouTube music jukebox for bars, restaurants, and building playlists on the fly, with vinyl-style playback, autoplay, crossfade, history, and local playlist memory.",
  },
  icons: {
    icon: "/parrot-logo.png",
    apple: "/parrot-logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a1625",
  width: 500,
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
