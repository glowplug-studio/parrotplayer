"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronUp, ChevronsUp, ClipboardCopy, GripVertical, Play, Trash2 } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { formatTrackDuration } from "@/lib/player/time"
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
  disableLayoutAnimation: boolean
}

const ROW_LAYOUT_TRANSITION = "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)"
const MOVE_BUTTON_CLASS = "h-8 w-8 disabled:opacity-100 disabled:text-zinc-700 disabled:[&_svg]:text-zinc-700"

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
    }, 120)

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
  disableLayoutAnimation,
}: SortableTrackProps) {
  const animateLayoutChanges = useCallback<AnimateLayoutChanges>(
    (args) => {
      if (disableLayoutAnimation) return false

      const orderChanged =
        args.previousItems.length !== args.items.length ||
        args.previousItems.some((item, index) => item !== args.items[index])

      return defaultAnimateLayoutChanges(args) || orderChanged
    },
    [disableLayoutAnimation]
  )

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    animateLayoutChanges,
    transition: {
      duration: 650,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  })

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isDragging ? transition : (transition ?? ROW_LAYOUT_TRANSITION),
    opacity: isDragging && !isDropPlaceholder ? 0 : 1,
  }
  const durationLabel = formatTrackDuration(track.durationSeconds)

  return (
    <div ref={setNodeRef} data-track-id={track.id} style={style} className="group relative z-0">
      {isDropPlaceholder ? (
        <div className="py-1">
          <div className="drop-marker-panel h-16 rounded-lg" />
        </div>
      ) : (
        <div
          className={`relative flex items-center gap-3 rounded-lg p-3 transition-[background-color,box-shadow] max-[399px]:flex-wrap ${
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
            className="group/play relative flex-shrink-0 cursor-pointer overflow-hidden rounded"
            data-tooltip-id="player-tooltip"
            data-tooltip-content="Play this track now"
          >
            <Image
              src={track.thumbnail}
              alt={track.title}
              width={48}
              height={48}
              className="w-12 h-12 rounded object-cover transition-all group-hover/play:ring-2 group-hover/play:ring-primary"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/play:opacity-100">
              <Play className="h-5 w-5 fill-white text-white" />
            </span>
          </button>
          <div className="relative z-0 min-w-0 flex-1 max-[959px]:overflow-visible">
            <p className="text-sm font-medium truncate max-[959px]:whitespace-normal max-[959px]:overflow-visible max-[959px]:text-clip">
              {track.title}
            </p>
            <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">{durationLabel}</p>
          </div>
          <div className="z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-[959px]:pointer-events-none max-[959px]:absolute max-[959px]:bottom-1 max-[959px]:right-1 max-[959px]:top-1 max-[959px]:z-30 max-[959px]:rounded-md max-[959px]:border max-[959px]:border-border max-[959px]:bg-secondary/40 max-[959px]:px-2 max-[959px]:py-1 max-[959px]:backdrop-blur-sm max-[959px]:group-hover:pointer-events-auto max-[399px]:pointer-events-auto max-[399px]:static max-[399px]:top-auto max-[399px]:right-auto max-[399px]:bottom-auto max-[399px]:w-full max-[399px]:justify-center max-[399px]:gap-5 max-[399px]:rounded-none max-[399px]:border-0 max-[399px]:border-t max-[399px]:border-border max-[399px]:bg-transparent max-[399px]:pt-2 max-[399px]:opacity-100 max-[399px]:backdrop-blur-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveToTop(track.id)}
              disabled={isFirst}
              className={MOVE_BUTTON_CLASS}
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
              className={MOVE_BUTTON_CLASS}
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
              className={MOVE_BUTTON_CLASS}
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
              <ClipboardCopy className="w-4 h-4" />
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
