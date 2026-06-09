"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AddTrackFormProps = {
  urlInput: string
  urlError: string
  onUrlInputChange: (value: string) => void
  onAddTrack: () => void
}

export function AddTrackForm({
  urlInput,
  urlError,
  onUrlInputChange,
  onAddTrack,
}: AddTrackFormProps) {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Paste YouTube URL here..."
            value={urlInput}
            onChange={(e) => onUrlInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddTrack()}
            className={`!bg-white !text-zinc-900 placeholder:!text-zinc-500 border-2 focus:border-primary ${urlError ? "border-destructive" : "border-zinc-300"}`}
          />
          {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
        </div>
        <Button
          onClick={onAddTrack}
          className="shrink-0"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Add YouTube URL"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}
