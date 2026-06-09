"use client"

import { useLayoutEffect, useRef } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { HistoryTrack } from "@/components/player/history-track"
import { SortableTrack } from "@/components/player/sortable-track"
import type { Track } from "@/lib/player/types"

type TrackListProps = {
  activeTab: "queue" | "history"
  queue: Track[]
  history: Track[]
  isPulsing: boolean
  onDragEnd: (event: DragEndEvent) => void
  onRemove: (id: string) => void
  onMoveToTop: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onPlayFromQueue: (track: Track) => void
  onCopyTrack: (track: Track) => void
  onRequeue: (track: Track) => void
}

export function TrackList({
  activeTab,
  queue,
  history,
  isPulsing,
  onDragEnd,
  onRemove,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onPlayFromQueue,
  onCopyTrack,
  onRequeue,
}: TrackListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const previousRowTopsRef = useRef<Map<string, number>>(new Map())
  const skipNextFlipAnimationRef = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    const previousRowTops = previousRowTopsRef.current
    const nextRowTops = new Map<string, number>()
    const shouldSkipAnimation = skipNextFlipAnimationRef.current
    skipNextFlipAnimationRef.current = false

    list.querySelectorAll<HTMLElement>("[data-track-id]").forEach((row) => {
      const trackId = row.dataset.trackId
      if (!trackId) return

      const nextTop = row.getBoundingClientRect().top
      const previousTop = previousRowTops.get(trackId)
      nextRowTops.set(trackId, nextTop)

      if (shouldSkipAnimation) return
      if (previousTop === undefined) return

      const deltaY = previousTop - nextTop
      if (Math.abs(deltaY) < 1) return

      row.animate(
        [
          { transform: `translateY(${deltaY}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: 700,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      )
    })

    previousRowTopsRef.current = nextRowTops
  }, [queue])

  const handleDragEnd = (event: DragEndEvent) => {
    skipNextFlipAnimationRef.current = true
    onDragEnd(event)
  }

  return (
    <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-4">
      {activeTab === "queue" ? (
        queue.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={queue.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <SortableTrack
                    key={track.id}
                    track={track}
                    index={index}
                    onRemove={onRemove}
                    onMoveToTop={onMoveToTop}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    isFirst={index === 0}
                    isLast={index === queue.length - 1}
                    onPlay={onPlayFromQueue}
                    onCopy={onCopyTrack}
                    isPulsing={index === 0 && isPulsing}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">Queue is empty</p>
            <p className="text-xs mt-1">Add YouTube URLs to start playing</p>
          </div>
        )
      ) : history.length > 0 ? (
        <div className="space-y-2">
          {history.map((track) => (
            <HistoryTrack key={track.id} track={track} onRequeue={onRequeue} onCopy={onCopyTrack} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <p className="text-sm">No history yet</p>
          <p className="text-xs mt-1">Played tracks will appear here</p>
        </div>
      )}
    </div>
  )
}
