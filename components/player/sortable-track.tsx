"use client"

import { useEffect, useRef, useState } from "react"
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronUp, ChevronsUp, Copy, GripVertical, Trash2 } from "lucide-react"
import Image from "next/image"

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
  isDropPlaceholder: boolean
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges(args) || args.previousItems !== args.items

function AnimatedTrackNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [direction, setDirection] = useState<"up" | "down" | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clearDirectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const displayValueRef = useRef(value)

  useEffect(() => {
    if (displayValueRef.current === value) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (clearDirectionTimeoutRef.current) {
      clearTimeout(clearDirectionTimeoutRef.current)
    }

    const stepDirection = value > displayValueRef.current ? 1 : -1
    setDirection(stepDirection > 0 ? "up" : "down")

    intervalRef.current = setInterval(() => {
      let nextValue = displayValueRef.current + stepDirection

      if ((stepDirection > 0 && nextValue >= value) || (stepDirection < 0 && nextValue <= value)) {
        nextValue = value
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        clearDirectionTimeoutRef.current = setTimeout(() => setDirection(null), 120)
      }

      displayValueRef.current = nextValue
      setDisplayValue(nextValue)
    }, 60)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (clearDirectionTimeoutRef.current) {
        clearTimeout(clearDirectionTimeoutRef.current)
      }
    }
  }, [value])

  return (
    <span className="track-number-reel text-primary font-bold">
      <span
        key={displayValue}
        className={direction ? "track-number-value" : undefined}
        data-direction={direction ?? undefined}
      >
        {displayValue}
      </span>
    </span>
  )
}

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
  isDropPlaceholder,
}: SortableTrackProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    animateLayoutChanges,
    transition: {
      duration: 240,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  })

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isDragging ? transition : (transition ?? "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)"),
    opacity: isDragging && !isDropPlaceholder ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} data-track-id={track.id} style={style} className="group">
      {isDropPlaceholder ? (
        <div className="py-1">
          <div className="drop-marker-panel h-16 rounded-lg" />
        </div>
      ) : (
        <div
          className={`flex items-center gap-3 rounded-lg p-3 transition-[background-color,box-shadow] ${
            isPulsing ? "animate-pulse-red ring-1 ring-destructive/60" : "bg-secondary/50 hover:bg-secondary"
          }`}
        >
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <AnimatedTrackNumber value={index + 1} />
          <button
            onClick={() => onPlay(track)}
            className="flex-shrink-0 cursor-pointer"
            data-tooltip-id="player-tooltip"
            data-tooltip-content="Play this track now"
          >
            <Image
              src={track.thumbnail}
              alt={track.title}
              width={48}
              height={48}
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
              className="h-8 w-8 text-destructive hover:text-white"
              data-tooltip-id="player-tooltip"
              data-tooltip-content="Remove from queue"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
