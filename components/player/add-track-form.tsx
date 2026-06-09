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

export function AddTrackForm({ urlInput, urlError, onUrlInputChange, onAddTrack }: AddTrackFormProps) {
  return (
    <div className="border-b border-border">
      <div className="flex min-h-12">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Paste YouTube URL here..."
            value={urlInput}
            onChange={(e) => onUrlInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddTrack()}
            className={`h-full rounded-none border-0 !bg-white !font-bold !text-zinc-900 placeholder:!font-bold placeholder:!text-zinc-500 ${urlError ? "ring-1 ring-destructive" : ""}`}
          />
          {urlError && <p className="px-3 py-1 text-xs text-destructive">{urlError}</p>}
        </div>
        <Button
          onClick={onAddTrack}
          className="h-auto shrink-0 rounded-none px-5 font-bold"
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
