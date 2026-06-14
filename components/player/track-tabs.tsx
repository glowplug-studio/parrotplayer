"use client"

import { ListX } from "lucide-react"
import { useTranslations } from "next-intl"

type TrackTabsProps = {
  activeTab: "queue" | "history"
  queueCount: number
  queueDurationLabel: string
  historyCount: number
  onActiveTabChange: (tab: "queue" | "history") => void
  onEraseMemory: () => void
}

export function TrackTabs({
  activeTab,
  queueCount,
  queueDurationLabel,
  historyCount,
  onActiveTabChange,
  onEraseMemory,
}: TrackTabsProps) {
  const t = useTranslations("TrackTabs")

  return (
    <div className="flex border-b border-border">
      <button
        onClick={() => onActiveTabChange("queue")}
        className={`flex-1 cursor-pointer py-3 text-sm font-bold transition-colors ${
          activeTab === "queue"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-tooltip-id="player-tooltip"
        data-tooltip-content={t("showQueue")}
      >
        {t("queue")} ({queueCount}) <span className="text-muted-foreground">{queueDurationLabel}</span>
      </button>
      <button
        onClick={() => onActiveTabChange("history")}
        className={`flex-1 cursor-pointer py-3 text-sm font-bold transition-colors ${
          activeTab === "history"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-tooltip-id="player-tooltip"
        data-tooltip-content={t("showHistory")}
      >
        {t("history")} ({historyCount})
      </button>
      <button
        onClick={onEraseMemory}
        className="flex w-14 cursor-pointer items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-destructive"
        aria-label={t("erase")}
        data-tooltip-id="player-tooltip"
        data-tooltip-content={t("erase")}
      >
        <ListX className="w-5 h-5" />
      </button>
    </div>
  )
}
