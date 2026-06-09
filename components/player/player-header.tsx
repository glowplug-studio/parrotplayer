"use client"

import { HelpCircle, ToggleLeft, ToggleRight } from "lucide-react"
import Image from "next/image"

import type { OverlapSetting } from "@/lib/player/types"

type PlayerHeaderProps = {
  autoplay: boolean
  overlap: OverlapSetting
  onAutoplayToggle: () => void
  onOverlapChange: (overlap: OverlapSetting) => void
  onHelpOpen: () => void
}

export function PlayerHeader({
  autoplay,
  overlap,
  onAutoplayToggle,
  onOverlapChange,
  onHelpOpen,
}: PlayerHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/80">
      <div className="flex items-center gap-3">
        <Image
          src="/parrot-logo.png"
          alt="Parrot Player"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <h1 className="text-xl font-bold">Parrot Player</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={onAutoplayToggle}
          className="flex cursor-pointer items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          data-tooltip-id="player-tooltip"
          data-tooltip-content={autoplay ? "Turn autoplay off" : "Turn autoplay on"}
        >
          {autoplay ? (
            <ToggleRight className="w-6 h-6 text-primary" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
          Autoplay
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">Overlap:</span>
          <select
            value={overlap}
            onChange={(e) => onOverlapChange(e.target.value as OverlapSetting)}
            disabled={!autoplay}
            className="bg-card border border-border rounded-md px-2 py-1 text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            data-tooltip-id="player-tooltip"
            data-tooltip-content="Set overlap crossfade time"
          >
            <option value="none">None</option>
            <option value="2s">2s</option>
            <option value="4s">4s</option>
            <option value="10s">10s</option>
          </select>
        </div>

        <button
          onClick={onHelpOpen}
          className="flex cursor-pointer items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Open help"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-bold">Help</span>
        </button>
      </div>
    </div>
  )
}
