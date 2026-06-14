"use client"

import { formatDistanceToNow } from "date-fns"
import { ClipboardCopy, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { Track } from "@/lib/player/types"

type HistoryTrackProps = {
  track: Track
  onRequeue: (track: Track) => void
  onCopy: (track: Track) => void
  onRemove: (id: string) => void
}

export function HistoryTrack({ track, onRequeue, onCopy, onRemove }: HistoryTrackProps) {
  const t = useTranslations("TrackActions")

  return (
    <div className="group relative z-0 flex items-center gap-3 rounded-lg bg-secondary/30 p-3 transition-colors hover:bg-secondary/50 max-[399px]:flex-wrap">
      <Image
        src={track.thumbnail}
        alt={track.title}
        width={48}
        height={48}
        className="w-12 h-12 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground">
          {t("played", { time: formatDistanceToNow(track.addedAt, { addSuffix: true }) })}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-[399px]:w-full max-[399px]:justify-center max-[399px]:gap-5 max-[399px]:border-t max-[399px]:border-border max-[399px]:pt-2 max-[399px]:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCopy(track)}
          className="h-8 w-8"
          aria-label={t("copyUrl")}
          data-tooltip-id="player-tooltip"
          data-tooltip-content={t("copyUrl")}
        >
          <ClipboardCopy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRequeue(track)}
          className="h-8 w-8"
          aria-label={t("addBack")}
          data-tooltip-id="player-tooltip"
          data-tooltip-content={t("addBack")}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(track.id)}
          className="h-8 w-8 text-destructive hover:text-white"
          aria-label={t("removeHistory")}
          data-tooltip-id="player-tooltip"
          data-tooltip-content={t("removeHistory")}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
