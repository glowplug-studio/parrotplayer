"use client"

import { useEffect, useRef, useState } from "react"
import { Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages"
import type { AppLocale } from "@/i18n/routing"

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const t = useTranslations("Language")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLanguage = LANGUAGE_OPTIONS.find((option) => option.locale === locale) ?? LANGUAGE_OPTIONS[0]

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && containerRef.current?.contains(target)) return

      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t("changeLanguage")}: ${t(locale)}`}
        data-tooltip-id="player-tooltip"
        data-tooltip-content={t("changeLanguage")}
      >
        <Globe className="h-3.5 w-3.5" />
        <Image src={currentLanguage.flag} alt="" width={16} height={16} className="h-4 w-4 rounded-full" />
        <span className="max-[420px]:sr-only">{t(locale)}</span>
      </button>

      {isOpen ? (
        <div
          className="absolute bottom-full left-0 z-[110] mb-2 min-w-44 overflow-hidden rounded-lg border border-border bg-card/95 py-1 shadow-2xl backdrop-blur-md"
          role="menu"
          aria-label={t("menuLabel")}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <Link
              key={option.locale}
              href={option.locale === "en" ? "/" : `/${option.locale}`}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground ${
                option.locale === locale ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-current={option.locale === locale ? "true" : undefined}
            >
              <Image src={option.flag} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full" />
              <span>{t(option.locale)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
