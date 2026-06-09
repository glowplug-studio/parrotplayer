"use client"

import { ListX } from "lucide-react"

type TrackTabsProps = {
  activeTab: "queue" | "history"
  queueCount: number
  historyCount: number
  onActiveTabChange: (tab: "queue" | "history") => void
  onEraseMemory: () => void
}

export function TrackTabs({
  activeTab,
  queueCount,
  historyCount,
  onActiveTabChange,
  onEraseMemory,
}: TrackTabsProps) {
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
        data-tooltip-content="Show queued tracks"
      >
        Queue ({queueCount})
      </button>
      <button
        onClick={() => onActiveTabChange("history")}
        className={`flex-1 cursor-pointer py-3 text-sm font-bold transition-colors ${
          activeTab === "history"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-tooltip-id="player-tooltip"
        data-tooltip-content="Show played tracks"
      >
        History ({historyCount})
      </button>
      <button
        onClick={onEraseMemory}
        className="flex w-14 cursor-pointer items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-destructive"
        data-tooltip-id="player-tooltip"
        data-tooltip-content="Erase saved queue, history, and settings"
      >
        <ListX className="w-5 h-5" />
      </button>
    </div>
  )
}
