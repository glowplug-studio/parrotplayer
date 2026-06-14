import type { MetadataRoute } from "next"

import { routing } from "@/i18n/routing"

const SITE_URL = "https://parrotplayer.site"
const LAST_MODIFIED = new Date("2026-06-14T00:00:00.000Z")

function getLocalePath(locale: string) {
  return locale === routing.defaultLocale ? "/" : `/${locale}`
}

function getAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString()
}

function getLanguageAlternates() {
  return Object.fromEntries([
    ...routing.locales.map((locale) => [locale, getAbsoluteUrl(getLocalePath(locale))]),
    ["x-default", getAbsoluteUrl("/")],
  ])
}

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = getLanguageAlternates()

  return routing.locales.map((locale) => ({
    url: getAbsoluteUrl(getLocalePath(locale)),
    lastModified: LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: {
      languages,
    },
  }))
}
