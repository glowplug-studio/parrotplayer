"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import AnimateHeight from "react-animate-height"
import { X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/player/language-switcher"
import { useChangelog, type Changelog } from "@/hooks/player/use-changelog"
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages"

type InfoPanel = "about" | "use-cases" | "release-notes" | null

export function PlaylistInfoDrawer() {
  const t = useTranslations("Info")
  const [activePanel, setActivePanel] = useState<InfoPanel>(null)
  const { changelog, hasError: hasChangelogError } = useChangelog()
  const panelRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const isOpen = activePanel !== null

  const closePanel = useCallback(() => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && panelRef.current?.contains(activeElement)) {
      activeElement.blur()
    }

    setActivePanel(null)
  }, [])

  const togglePanel = (panel: Exclude<InfoPanel, null>) => {
    setActivePanel((currentPanel) => (currentPanel === panel ? null : panel))
  }

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) || footerRef.current?.contains(target)) return

      closePanel()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [closePanel, isOpen])

  return (
    <>
      <div className="pointer-events-none fixed bottom-8 left-1/2 z-[90] w-full max-w-2xl -translate-x-1/2 px-2">
        <AnimateHeight duration={320} height={isOpen ? "auto" : 0}>
          <div
            ref={panelRef}
            className="pointer-events-auto relative max-h-[calc(100dvh-21rem)] overflow-y-auto rounded-t-lg border border-border bg-card/95 p-4 pr-12 text-sm shadow-2xl backdrop-blur-md dark-scrollbar"
          >
            <button
              type="button"
              onClick={closePanel}
              aria-label={t("close")}
              className="absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary/80 text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-tooltip-id="player-tooltip"
              data-tooltip-content={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
            {activePanel === "about" ? <AboutContent /> : null}
            {activePanel === "use-cases" ? <UseCasesContent /> : null}
            {activePanel === "release-notes" ? (
              <ReleaseNotesContent changelog={changelog} hasError={hasChangelogError} />
            ) : null}
          </div>
        </AnimateHeight>
      </div>

      <div
        ref={footerRef}
        className="fixed bottom-0 left-1/2 z-[90] flex h-8 w-full max-w-2xl -translate-x-1/2 items-center border-t border-border bg-card/90 px-3 text-xs text-muted-foreground shadow-[0_-8px_20px_rgb(0_0_0/0.18)] backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="#about"
            onClick={(event) => {
              event.preventDefault()
              togglePanel("about")
            }}
            className={`cursor-pointer font-medium transition-colors hover:text-foreground ${
              activePanel === "about" ? "text-foreground" : ""
            }`}
          >
            {t("about")}
          </a>
          <button
            type="button"
            onClick={() => togglePanel("use-cases")}
            className={`cursor-pointer font-medium transition-colors hover:text-foreground ${
              activePanel === "use-cases" ? "text-foreground" : ""
            }`}
          >
            {t("useCases")}
          </button>
        </div>
        <button
          type="button"
          onClick={() => togglePanel("release-notes")}
          className={`ml-auto cursor-pointer rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground ${
            activePanel === "release-notes" ? "text-foreground" : ""
          }`}
        >
          {changelog ? `v${changelog.latestVersion}` : "v..."}
        </button>
      </div>
    </>
  )
}

function AboutContent() {
  const t = useTranslations("Info")
  const languageT = useTranslations("Language")

  return (
    <div className="space-y-5 text-muted-foreground">
      <section id="about" className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">{t("aboutHeading")}</h2>
        <Image
          src="/logo.svg"
          alt="ParrotPlayer"
          width={300}
          height={300}
          className="mx-auto h-auto w-full max-w-[300px] rounded-lg"
        />
        <p>{t("aboutP1")}</p>
        <p>{t("aboutP2")}</p>
      </section>

      <section id="use-cases" className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">{t("problemHeading")}</h2>
        <p>{t("problemP1")}</p>
        <p>{t("problemP2")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">{t("technologyHeading")}</h2>
        <p>{t("technologyP")}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">{t("domainHeading")}</h3>
        <p>{t("domainP")}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">{t("languagesHeading")}</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((option) => (
            <Link
              key={option.locale}
              href={option.locale === "en" ? "/" : `/${option.locale}`}
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {languageT(option.locale)}
            </Link>
          ))}
        </div>
        <h3 className="pt-3 text-base font-bold text-foreground">{t("creditHeading")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("developedBy")}{" "}
          <a
            href="https://remoteproduct.dev"
            target="_blank"
            rel="noopener noreferrer"
            title="Jay the Remote Product Developer"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Jay RPD
          </a>
        </p>
      </section>
    </div>
  )
}

function UseCasesContent() {
  const t = useTranslations("Info")

  return (
    <div className="space-y-5 text-muted-foreground">
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">{t("useCasesHeading")}</h2>
        <p>{t("useCasesP1")}</p>
        <p>{t("useCasesP2")}</p>
        <p>{t("useCasesP3")}</p>
        <p>{t("useCasesP4")}</p>
      </section>
    </div>
  )
}

function ReleaseNotesContent({ changelog, hasError }: { changelog: Changelog | null; hasError: boolean }) {
  const t = useTranslations("Info")

  if (hasError) {
    return (
      <div className="space-y-3 text-muted-foreground">
        <h2 className="text-lg font-bold text-foreground">{t("releaseNotes")}</h2>
        <p>{t("releaseNotesError")}</p>
      </div>
    )
  }

  if (!changelog) {
    return (
      <div className="space-y-3 text-muted-foreground">
        <h2 className="text-lg font-bold text-foreground">{t("releaseNotes")}</h2>
        <p>{t("loadingReleaseNotes")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-muted-foreground">
      <h2 className="text-lg font-bold text-foreground">{t("releaseNotes")}</h2>
      {changelog.releases.map((release) => (
        <p key={release.version}>
          <strong className="text-foreground">
            V{release.version}: {release.date}.
          </strong>{" "}
          {release.description}
        </p>
      ))}
    </div>
  )
}
