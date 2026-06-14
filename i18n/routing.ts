import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "es", "ru", "de", "fr", "ja", "ko", "zh", "th", "hi"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
})

export type AppLocale = (typeof routing.locales)[number]
