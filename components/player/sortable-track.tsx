"use client"

import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronUp, ChevronsUp, Copy, GripVertical, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Track } from "@/lib/player/types"

type SortableTrackProps = {
  track: Track
  index: number
  onRemove: (id: string) => void
  onMoveToTop: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
  onPlay: (track: Track) => void
  onCopy: (track: Track) => void
  isPulsing: boolean
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges(args) || args.previousItems !== args.items

export function SortableTrack({
  track,
  index,
  onRemove,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onPlay,
  onCopy,
  isPulsing,
}: SortableTrackProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    animateLayoutChanges,
    transition: {
      duration: 700,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      data-track-id={track.id}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg group transition-colors ${
        isPulsing ? "animate-pulse-red ring-1 ring-destructive/60" : "bg-secondary/50 hover:bg-secondary"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        data-tooltip-id="player-tooltip"
        data-tooltip-content="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-primary font-bold w-6 text-center">{index + 1}</span>
      <button
        onClick={() => onPlay(track)}
        className="flex-shrink-0 cursor-pointer"
        data-tooltip-id="player-tooltip"
        data-tooltip-content="Play this track now"
      >
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-12 h-12 rounded object-cover hover:ring-2 hover:ring-primary transition-all"
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveToTop(track.id)}
          disabled={isFirst}
          className="h-8 w-8"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Move to top"
        >
          <ChevronsUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveUp(track.id)}
          disabled={isFirst}
          className="h-8 w-8"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Move up"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveDown(track.id)}
          disabled={isLast}
          className="h-8 w-8"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Move down"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCopy(track)}
          className="h-8 w-8"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Copy YouTube URL"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(track.id)}
          className="h-8 w-8 text-destructive hover:text-destructive"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Remove from queue"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
