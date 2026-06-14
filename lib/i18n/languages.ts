import type { AppLocale } from "@/i18n/routing"

export type LanguageOption = {
  locale: AppLocale
  flag: string
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { locale: "en", flag: "/flags/en.svg" },
  { locale: "es", flag: "/flags/es.svg" },
  { locale: "ru", flag: "/flags/ru.svg" },
  { locale: "de", flag: "/flags/de.svg" },
  { locale: "fr", flag: "/flags/fr.svg" },
  { locale: "ja", flag: "/flags/ja.svg" },
  { locale: "ko", flag: "/flags/ko.svg" },
  { locale: "zh", flag: "/flags/zh.svg" },
  { locale: "th", flag: "/flags/th.svg" },
  { locale: "hi", flag: "/flags/hi.svg" },
]
