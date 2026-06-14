"use client"

import { useEffect, useState, type KeyboardEvent } from "react"
import { HelpCircle, ToggleLeft, ToggleRight } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import { DEFAULT_PLAYER_TITLE } from "@/hooks/player/use-player-title-storage"
import { isOverlapSetting, OVERLAP_LABELS, OVERLAP_OPTIONS, type OverlapSetting } from "@/lib/player/types"

type PlayerHeaderProps = {
  playerTitle: string
  autoplay: boolean
  overlap: OverlapSetting
  onPlayerTitleChange: (title: string) => void
  onAutoplayToggle: () => void
  onOverlapChange: (overlap: OverlapSetting) => void
  onHelpOpen: () => void
  onLogoClick: () => void
}

export function PlayerHeader({
  playerTitle,
  autoplay,
  overlap,
  onPlayerTitleChange,
  onAutoplayToggle,
  onOverlapChange,
  onHelpOpen,
  onLogoClick,
}: PlayerHeaderProps) {
  const t = useTranslations("Header")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(playerTitle)

  useEffect(() => {
    if (!isEditingTitle) {
      setDraftTitle(playerTitle)
    }
  }, [isEditingTitle, playerTitle])

  const commitTitle = () => {
    onPlayerTitleChange(draftTitle.trim() || DEFAULT_PLAYER_TITLE)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitTitle()
    }
    if (event.key === "Escape") {
      setDraftTitle(playerTitle)
      setIsEditingTitle(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/80">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onLogoClick}
          className="cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          data-tooltip-id="player-tooltip"
          data-tooltip-content={t("playLogoVideo")}
        >
          <Image src="/logo.svg" alt="ParrotPlayer" width={40} height={40} className="rounded-lg" />
        </button>
        {isEditingTitle ? (
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="h-9 min-w-0 max-w-[14rem] rounded-md border border-border bg-card px-2 text-xl font-bold outline-none focus:ring-2 focus:ring-primary max-[399px]:hidden"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            className="cursor-pointer truncate text-left text-xl font-bold hover:text-primary max-[399px]:hidden"
            data-tooltip-id="player-tooltip"
            data-tooltip-content={t("editPlayerTitle")}
          >
            {playerTitle}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={onAutoplayToggle}
          className="flex cursor-pointer items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          data-tooltip-id="player-tooltip"
          data-tooltip-content={autoplay ? t("turnAutoplayOff") : t("turnAutoplayOn")}
        >
          {t("autoplay")}
          {autoplay ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6" />}
        </button>

        <div
          aria-hidden={!autoplay}
          className={`flex items-center gap-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform,margin] duration-300 ease-in-out ${
            autoplay
              ? "max-w-32 translate-x-0 opacity-100"
              : "pointer-events-none -ml-2 max-w-0 -translate-x-2 opacity-0"
          }`}
        >
          <span className="text-sm font-bold text-muted-foreground">{t("overlap")}</span>
          <select
            value={overlap}
            onChange={(event) => {
              if (isOverlapSetting(event.target.value)) {
                onOverlapChange(event.target.value)
              }
            }}
            disabled={!autoplay}
            tabIndex={autoplay ? 0 : -1}
            className="h-9 w-14 truncate rounded-md border border-border bg-card px-1 text-sm font-bold cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            data-tooltip-id="player-tooltip"
            data-tooltip-content={t("setOverlap")}
          >
            {OVERLAP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {OVERLAP_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onHelpOpen}
          className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-secondary/50 px-3 font-bold text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-[649px]:w-9 max-[649px]:px-0"
          data-tooltip-id="player-tooltip"
          data-tooltip-content={t("openHelp")}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-bold max-[649px]:sr-only">{t("help")}</span>
        </button>
      </div>
    </div>
  )
}
