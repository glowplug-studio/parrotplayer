"use client"

import type { DragEvent } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AddTrackFormProps = {
  urlInput: string
  urlError: string
  onUrlInputChange: (value: string) => void
  onAddTrack: () => void
  onExternalDragEnter: (event: DragEvent<HTMLElement>) => void
  onExternalDragOver: (event: DragEvent<HTMLElement>) => void
  onExternalDragLeave: () => void
  onExternalDrop: (event: DragEvent<HTMLElement>) => void
}

export function AddTrackForm({
  urlInput,
  urlError,
  onUrlInputChange,
  onAddTrack,
  onExternalDragEnter,
  onExternalDragOver,
  onExternalDragLeave,
  onExternalDrop,
}: AddTrackFormProps) {
  return (
    <div
      className="relative border-b border-border"
      onDragEnterCapture={onExternalDragEnter}
      onDragOverCapture={onExternalDragOver}
      onDragLeave={onExternalDragLeave}
      onDropCapture={onExternalDrop}
    >
      {urlError && (
        <p className="pointer-events-none absolute left-1/2 top-0 z-30 w-full -translate-x-1/2 -translate-y-full px-4 pb-2 text-center text-base font-bold text-destructive">
          {urlError}
        </p>
      )}
      <div className="flex min-h-12">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Paste URL or drag the YouTube title here"
            value={urlInput}
            onChange={(e) => onUrlInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddTrack()}
            className={`h-full rounded-none border-0 !bg-white !font-bold !text-zinc-900 placeholder:!font-bold placeholder:!text-zinc-500 ${urlError ? "ring-1 ring-destructive" : ""}`}
          />
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
