"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { DndContext, DragOverlay, closestCenter, defaultDropAnimationSideEffects, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragCancelEvent, type DragEndEvent, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"

import { HistoryTrack } from "@/components/player/history-track"
import { SortableTrack } from "@/components/player/sortable-track"
import type { Track } from "@/lib/player/types"

type TrackListProps = {
  activeTab: "queue" | "history"
  queue: Track[]
  history: Track[]
  isPulsing: boolean
  onDragEnd: (event: DragEndEvent, orderedTracks?: Track[]) => void
  onRemove: (id: string) => void
  onMoveToTop: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onPlayFromQueue: (track: Track) => void
  onCopyTrack: (track: Track) => void
  onRequeue: (track: Track) => void
  onRemoveFromHistory: (id: string) => void
}

function TrackDragPreview({ track, index }: { track: Track; index: number }) {
  return (
    <>
      <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground" />
      <span className="text-primary font-bold w-6 text-center">{index >= 0 ? index + 1 : ""}</span>
      <img
        src={track.thumbnail}
        alt={track.title}
        className="h-12 w-12 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
      </div>
    </>
  )
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
  onRemoveFromHistory,
}: TrackListProps) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [overTrackId, setOverTrackId] = useState<string | null>(null)
  const [visualQueue, setVisualQueue] = useState(queue)
  const listRef = useRef<HTMLDivElement>(null)
  const previousRowTopsRef = useRef<Map<string, number>>(new Map())
  const skipNextFlipAnimationForTrackRef = useRef<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (!activeTrackId) {
      setVisualQueue(queue)
    }
  }, [activeTrackId, queue])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    const previousRowTops = previousRowTopsRef.current
    const nextRowTops = new Map<string, number>()
    const skippedTrackId = skipNextFlipAnimationForTrackRef.current
    skipNextFlipAnimationForTrackRef.current = null

    list.querySelectorAll<HTMLElement>("[data-track-id]").forEach((row) => {
      const trackId = row.dataset.trackId
      if (!trackId) return

      const nextTop = row.getBoundingClientRect().top
      const previousTop = previousRowTops.get(trackId)
      nextRowTops.set(trackId, nextTop)

      if (trackId === skippedTrackId) return
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
  }, [visualQueue])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTrackId(String(event.active.id))
    setOverTrackId(null)
    setVisualQueue(queue)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const nextOverTrackId = event.over ? String(event.over.id) : null
    const draggedTrackId = String(event.active.id)

    setOverTrackId(nextOverTrackId)

    if (!nextOverTrackId || draggedTrackId === nextOverTrackId) return

    setVisualQueue((items) => {
      const oldIndex = items.findIndex((item) => item.id === draggedTrackId)
      const newIndex = items.findIndex((item) => item.id === nextOverTrackId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return items

      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    skipNextFlipAnimationForTrackRef.current = String(event.active.id)
    onDragEnd(event, visualQueue)
    setActiveTrackId(null)
    setOverTrackId(null)
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveTrackId(null)
    setOverTrackId(null)
    setVisualQueue(queue)
  }

  const activeTrack = activeTrackId ? visualQueue.find((track) => track.id === activeTrackId) : null

  return (
    <div ref={listRef} className="track-list-scroller relative min-h-0 flex-1 overflow-y-auto p-2">
      {activeTab === "queue" ? (
        queue.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={visualQueue.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {visualQueue.map((track, index) => (
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
                    isDropPlaceholder={track.id === activeTrackId && Boolean(overTrackId)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                duration: 420,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0",
                    },
                  },
                }),
              }}
            >
              {activeTrack ? (
                <div className="flex items-center gap-3 rounded-lg bg-secondary p-3 shadow-2xl ring-1 ring-primary/40">
                  <TrackDragPreview track={activeTrack} index={visualQueue.findIndex((track) => track.id === activeTrack.id)} />
                </div>
              ) : null}
            </DragOverlay>
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
            <HistoryTrack
              key={track.id}
              track={track}
              onRequeue={onRequeue}
              onCopy={onCopyTrack}
              onRemove={onRemoveFromHistory}
            />
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
