import type { Metadata, Viewport } from "next"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"

import { routing } from "@/i18n/routing"
import "../globals.css"

const SITE_URL = "https://parrotplayer.site"
const OG_LOCALES: Record<string, string> = {
  en: "en_GB",
  es: "es_ES",
  ru: "ru_RU",
  de: "de_DE",
  fr: "fr_FR",
  ja: "ja_JP",
  ko: "ko_KR",
  zh: "zh_CN",
  th: "th_TH",
  hi: "hi_IN",
}

function getLocalePath(locale: string) {
  return locale === routing.defaultLocale ? "/" : `/${locale}`
}

function getLanguageAlternates() {
  return Object.fromEntries([...routing.locales.map((locale) => [locale, getLocalePath(locale)]), ["x-default", "/"]])
}

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const validLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  const t = await getTranslations({ locale: validLocale, namespace: "Metadata" })
  const canonicalPath = getLocalePath(validLocale)
  const ogLocale = OG_LOCALES[validLocale] ?? OG_LOCALES.en
  const alternateOgLocales = routing.locales
    .filter((alternateLocale) => alternateLocale !== validLocale)
    .map((alternateLocale) => OG_LOCALES[alternateLocale] ?? alternateLocale)

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
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
    alternates: {
      canonical: canonicalPath,
      languages: getLanguageAlternates(),
    },
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      siteName: "ParrotPlayer",
      type: "website",
      url: canonicalPath,
      locale: ogLocale,
      alternateLocale: alternateOgLocales,
      images: [
        {
          url: "/og-card.png",
          width: 1200,
          height: 630,
          alt: t("imageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("ogDescription"),
      images: [
        {
          url: "/og-card.png",
          alt: t("imageAlt"),
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
}

export const viewport: Viewport = {
  themeColor: "#1a1625",
  width: "device-width",
  initialScale: 1,
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark bg-background">
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
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
