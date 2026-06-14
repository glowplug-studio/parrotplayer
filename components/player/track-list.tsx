"use client"

import { useLayoutEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { GripVertical, Search } from "lucide-react"
import Image from "next/image"
import AnimateHeight from "react-animate-height"
import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"
import { HistoryTrack } from "@/components/player/history-track"
import { PlaylistInfoDrawer } from "@/components/player/playlist-info-drawer"
import { SortableTrack } from "@/components/player/sortable-track"
import { getDraggedLinkText } from "@/lib/player/drag-data"
import type { Track } from "@/lib/player/types"

const MANUAL_REORDER_ANIMATION_MS = 650
const QUEUE_ITEM_COLLAPSE_MS = 650

type TrackListProps = {
  activeTab: "queue" | "history"
  queue: Track[]
  history: Track[]
  isPulsing: boolean
  forceDropOverlay: boolean
  shouldAnimatePlayReorder: boolean
  onDragEnd: (event: DragEndEvent, orderedTracks?: Track[]) => void
  onRemove: (id: string) => void
  onMoveToTop: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onPlayFromQueue: (track: Track) => void
  onCopyTrack: (track: Track) => void
  onRequeue: (track: Track) => void
  onRemoveFromHistory: (id: string) => void
  onDropYouTubeLink: (value: string) => void
  collapsingTrackId: string | null
  onCollapseComplete: (id: string) => void
}

function TrackDragPreview({ track, index }: { track: Track; index: number }) {
  return (
    <>
      <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground" />
      <span className="text-primary font-bold w-6 text-center">{index >= 0 ? index + 1 : ""}</span>
      <Image
        src={track.thumbnail}
        alt={track.title}
        width={48}
        height={48}
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
  forceDropOverlay,
  shouldAnimatePlayReorder,
  onDragEnd,
  onRemove,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onPlayFromQueue,
  onCopyTrack,
  onRequeue,
  onRemoveFromHistory,
  onDropYouTubeLink,
  collapsingTrackId,
  onCollapseComplete,
}: TrackListProps) {
  const t = useTranslations("TrackList")
  const playerT = useTranslations("Player")
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [overTrackId, setOverTrackId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [visualQueue, setVisualQueue] = useState(queue)
  const [isExternalDragOver, setIsExternalDragOver] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const externalDragDepthRef = useRef(0)
  const manualReorderPreviousRowTopsRef = useRef<Map<string, number> | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredQueue = useMemo(() => {
    if (!normalizedSearchQuery) return queue

    return queue.filter((track) => track.title.toLowerCase().includes(normalizedSearchQuery))
  }, [normalizedSearchQuery, queue])
  const filteredHistory = useMemo(() => {
    if (!normalizedSearchQuery) return history

    return history.filter((track) => track.title.toLowerCase().includes(normalizedSearchQuery))
  }, [normalizedSearchQuery, history])

  const displayedQueue = activeTrackId ? visualQueue : filteredQueue
  const disableSortableLayoutAnimation = manualReorderPreviousRowTopsRef.current !== null || Boolean(collapsingTrackId)

  const captureVisibleRowTops = () => {
    const rowTops = new Map<string, number>()

    listRef.current?.querySelectorAll<HTMLElement>("[data-track-id]").forEach((row) => {
      const trackId = row.dataset.trackId
      if (!trackId) return

      rowTops.set(trackId, row.getBoundingClientRect().top)
    })

    return rowTops
  }

  const runManualReorder = (reorder: () => void) => {
    manualReorderPreviousRowTopsRef.current = activeTab === "queue" ? captureVisibleRowTops() : null
    reorder()
  }

  useLayoutEffect(() => {
    const previousRowTops = manualReorderPreviousRowTopsRef.current
    manualReorderPreviousRowTopsRef.current = null
    if (!previousRowTops?.size || activeTrackId) return

    listRef.current?.querySelectorAll<HTMLElement>("[data-track-id]").forEach((row) => {
      const trackId = row.dataset.trackId
      if (!trackId) return

      const previousTop = previousRowTops.get(trackId)
      if (previousTop === undefined) return

      const deltaY = previousTop - row.getBoundingClientRect().top
      if (Math.abs(deltaY) < 1) return

      row.animate([{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }], {
        duration: MANUAL_REORDER_ANIMATION_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      })
    })
  }, [activeTrackId, displayedQueue])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTrackId(String(event.active.id))
    setOverTrackId(null)
    setVisualQueue(filteredQueue)
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
    if (event.over) {
      onDragEnd(event, visualQueue)
    } else {
      setVisualQueue(filteredQueue)
    }
    setActiveTrackId(null)
    setOverTrackId(null)
  }

  const handleDragCancel = () => {
    setActiveTrackId(null)
    setOverTrackId(null)
    setVisualQueue(filteredQueue)
  }

  const handleExternalDragEnter = (event: DragEvent<HTMLElement>) => {
    if (activeTrackId) return

    event.preventDefault()
    event.stopPropagation()
    externalDragDepthRef.current += 1
    setIsExternalDragOver(true)
  }

  const handleExternalDragOver = (event: DragEvent<HTMLElement>) => {
    if (activeTrackId) return

    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
    setIsExternalDragOver(true)
  }

  const handleExternalDragLeave = () => {
    externalDragDepthRef.current = Math.max(0, externalDragDepthRef.current - 1)
    if (externalDragDepthRef.current === 0) {
      setIsExternalDragOver(false)
    }
  }

  const handleExternalDrop = (event: DragEvent<HTMLElement>) => {
    if (activeTrackId) return

    event.preventDefault()
    event.stopPropagation()
    externalDragDepthRef.current = 0
    setIsExternalDragOver(false)

    const draggedText = getDraggedLinkText(event.dataTransfer)
    onDropYouTubeLink(draggedText)
  }

  const handleMoveToTop = (id: string) => runManualReorder(() => onMoveToTop(id))
  const handleMoveUp = (id: string) => runManualReorder(() => onMoveUp(id))
  const handleMoveDown = (id: string) => runManualReorder(() => onMoveDown(id))
  const handlePlayFromQueue = (track: Track) => {
    if (shouldAnimatePlayReorder) {
      runManualReorder(() => onPlayFromQueue(track))
      return
    }

    onPlayFromQueue(track)
  }

  const activeTrack = activeTrackId ? displayedQueue.find((track) => track.id === activeTrackId) : null

  return (
    <div
      ref={listRef}
      className="track-list-scroller relative min-h-0 flex-1 overflow-y-auto px-2 pb-10"
      onDragEnterCapture={handleExternalDragEnter}
      onDragOverCapture={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDropCapture={handleExternalDrop}
    >
      <div className="sticky top-0 z-[80] -mx-2 bg-card/60 px-2 pb-2 pt-2.5 backdrop-blur-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={activeTab === "queue" ? t("searchQueue") : t("searchHistory")}
            className="h-9 rounded-lg border-border !bg-card pl-9 text-sm shadow-none"
          />
        </div>
      </div>
      {isExternalDragOver || forceDropOverlay ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 top-2 z-[90] flex items-center justify-center rounded-lg bg-card/60 p-4 backdrop-blur-md">
          <div className="drop-marker-panel flex min-h-40 w-full items-center justify-center rounded-lg px-6 text-center">
            <p className="text-sm font-medium text-foreground">{playerT("dropLink")}</p>
          </div>
        </div>
      ) : null}
      {activeTab === "queue" ? (
        queue.length > 0 ? (
          filteredQueue.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={displayedQueue.map((track) => track.id)} strategy={verticalListSortingStrategy}>
                <div className="relative z-0 pt-0.5">
                  {displayedQueue.map((track, displayIndex) => {
                    const queueIndex = queue.findIndex((queueTrack) => queueTrack.id === track.id)

                    return (
                      <AnimateHeight
                        key={track.id}
                        duration={QUEUE_ITEM_COLLAPSE_MS}
                        height={track.id === collapsingTrackId ? 0 : "auto"}
                        easing="cubic-bezier(0.22, 1, 0.36, 1)"
                        onHeightAnimationEnd={(height) => {
                          if (height === 0 && track.id === collapsingTrackId) {
                            onCollapseComplete(track.id)
                          }
                        }}
                      >
                        <div className={displayIndex === displayedQueue.length - 1 ? "" : "pb-2"}>
                          <SortableTrack
                            track={track}
                            index={queueIndex}
                            onRemove={onRemove}
                            onMoveToTop={handleMoveToTop}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            isFirst={queueIndex === 0}
                            isLast={queueIndex === queue.length - 1}
                            onPlay={handlePlayFromQueue}
                            onCopy={onCopyTrack}
                            isPulsing={queueIndex === 0 && isPulsing}
                            isDropPlaceholder={track.id === activeTrackId && Boolean(overTrackId)}
                            disableLayoutAnimation={disableSortableLayoutAnimation}
                          />
                        </div>
                      </AnimateHeight>
                    )
                  })}
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
                    <TrackDragPreview
                      track={activeTrack}
                      index={queue.findIndex((track) => track.id === activeTrack.id)}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p className="text-sm">{t("noMatching")}</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">{t("queueEmpty")}</p>
            <p className="text-xs mt-1">{t("addUrls")}</p>
          </div>
        )
      ) : history.length > 0 ? (
        filteredHistory.length > 0 ? (
          <div className="relative z-0 space-y-2 pt-0.5">
            {filteredHistory.map((track) => (
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
            <p className="text-sm">{t("noMatching")}</p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <p className="text-sm">{t("noHistory")}</p>
          <p className="text-xs mt-1">{t("historyAppears")}</p>
        </div>
      )}
      <PlaylistInfoDrawer />
    </div>
  )
}
