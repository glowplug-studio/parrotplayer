"use client"

import type { DragEvent } from "react"
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react"

import {
  BACKGROUND_FADE_MS,
  BACKGROUND_LAYER_OPACITY,
  FULL_PLAYER_WIDTH,
  HIDDEN_PLAYER_WIDTH,
  PLAYER_COLUMN_GAP,
  PLAYER_GAP_TRANSITION_CLASS,
  PLAYER_PANEL_TRANSITION,
  PLAYER_SINGLE_PANEL_CLASS,
  PLAYER_WIDTH_TRANSITION_CLASS,
} from "@/lib/player/constants"
import type { Track } from "@/lib/player/types"
import { VinylPlayer } from "@/components/player/vinyl-player"

type PlayerStageProps = {
  currentTrack: Track | null
  isPlaying: boolean
  isSpinningDown: boolean
  progress: number
  duration: number
  onPlayPause: () => void
  onPause: () => void
  onResume: () => void
  onSeek: (percentage: number) => void
  seekNudgeFeedback: { id: number; label: string } | null
  masterVolume: number
  onMasterVolumeChange: (volume: number) => void
  onSkipNext: () => void
  onSkipBack: () => void
  loopAll: boolean
  onLoopAllToggle: () => void
  canStartFromQueue: boolean
  emptyTrackMessage: string
  isPlayerCollapsed: boolean
  onPlayerCollapseToggle: () => void
  showBackButton: boolean
  isTransitioning: boolean
  isTransitionSettling: boolean
  primaryWidth: string
  incomingPanelWidth: string
  incomingTrack: Track | null
  incomingProgress: number
  incomingDuration: number
  incomingPlaying: boolean
  onSecondaryPlayPause: () => void
  onSecondaryPause: () => void
  onSecondaryResume: () => void
  onSecondarySeek: (percentage: number) => void
  backgroundLayers: [string | null, string | null]
  visibleBackgroundLayer: 0 | 1
  fadingBackgroundLayer: 0 | 1 | null
  isExternalDragOver: boolean
  onExternalDragEnter: (event: DragEvent<HTMLElement>) => void
  onExternalDragOver: (event: DragEvent<HTMLElement>) => void
  onExternalDragLeave: () => void
  onExternalDrop: (event: DragEvent<HTMLElement>) => void
}

const noop = () => {}

export function PlayerStage({
  currentTrack,
  isPlaying,
  isSpinningDown,
  progress,
  duration,
  onPlayPause,
  onPause,
  onResume,
  onSeek,
  seekNudgeFeedback,
  masterVolume,
  onMasterVolumeChange,
  onSkipNext,
  onSkipBack,
  loopAll,
  onLoopAllToggle,
  canStartFromQueue,
  emptyTrackMessage,
  isPlayerCollapsed,
  onPlayerCollapseToggle,
  showBackButton,
  isTransitioning,
  isTransitionSettling,
  primaryWidth,
  incomingPanelWidth,
  incomingTrack,
  incomingProgress,
  incomingDuration,
  incomingPlaying,
  onSecondaryPlayPause,
  onSecondaryPause,
  onSecondaryResume,
  onSecondarySeek,
  backgroundLayers,
  visibleBackgroundLayer,
  fadingBackgroundLayer,
  isExternalDragOver,
  onExternalDragEnter,
  onExternalDragOver,
  onExternalDragLeave,
  onExternalDrop,
}: PlayerStageProps) {
  const incomingPanelHidden = incomingPanelWidth === HIDDEN_PLAYER_WIDTH
  const showIncomingPanel = (isTransitioning || isTransitionSettling) && incomingTrack

  return (
    <div
      className={`relative isolate flex shrink-0 flex-col overflow-hidden border-b border-border transition-[min-height,padding] duration-300 max-[399px]:min-h-[15rem] max-[399px]:px-4 max-[399px]:py-2 ${
        isPlayerCollapsed ? "min-h-[7rem] p-2" : "min-h-[29rem] p-8"
      }`}
      onDragEnterCapture={onExternalDragEnter}
      onDragOverCapture={onExternalDragOver}
      onDragLeave={onExternalDragLeave}
      onDropCapture={onExternalDrop}
      data-player-stage-dropzone
    >
      <button
        type="button"
        onClick={onPlayerCollapseToggle}
        className={`absolute right-2 top-2 z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
          isPlayerCollapsed ? "text-primary" : ""
        }`}
        aria-pressed={isPlayerCollapsed}
        aria-label={isPlayerCollapsed ? "Expand player" : "Condense player"}
        data-tooltip-id="player-tooltip"
        data-tooltip-content={isPlayerCollapsed ? "Expand player" : "Condense player"}
      >
        {isPlayerCollapsed ? <ChevronsUpDown className="h-4 w-4" /> : <ChevronsDownUp className="h-4 w-4" />}
      </button>
      {backgroundLayers.map((layerImage, layerIndex) => (
        <div
          key={layerIndex}
          className="absolute inset-0 pointer-events-none transition-opacity ease-out"
          style={{
            backgroundImage: layerImage ? `url(${layerImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px)",
            transitionDuration: `${BACKGROUND_FADE_MS}ms`,
            opacity:
              layerImage &&
              (layerIndex === fadingBackgroundLayer ||
                (layerIndex === visibleBackgroundLayer && fadingBackgroundLayer === null))
                ? BACKGROUND_LAYER_OPACITY
                : 0,
            transform: "scale(1.2)",
            zIndex: layerIndex === fadingBackgroundLayer ? -1 : -2,
          }}
        />
      ))}

      {isExternalDragOver ? (
        <div className="pointer-events-none absolute inset-2 z-40 flex items-center justify-center rounded-lg bg-card/60 p-4 backdrop-blur-md">
          <div className="drop-marker-panel flex h-full min-h-24 w-full items-center justify-center rounded-lg px-6 text-center">
            <p className="text-sm font-medium text-foreground">drop youtube link here to add to the list</p>
          </div>
        </div>
      ) : null}

      <div
        className={`relative z-10 flex ${
          isPlayerCollapsed ? "min-h-0 flex-1 items-stretch pr-8" : ""
        } ${isTransitioning ? PLAYER_GAP_TRANSITION_CLASS : ""}`}
        style={
          isTransitioning
            ? { columnGap: primaryWidth === HIDDEN_PLAYER_WIDTH || incomingPanelHidden ? 0 : PLAYER_COLUMN_GAP }
            : undefined
        }
      >
        <div
          className={isTransitioning ? PLAYER_WIDTH_TRANSITION_CLASS : PLAYER_SINGLE_PANEL_CLASS}
          style={isTransitioning ? { width: primaryWidth } : undefined}
        >
          <VinylPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            isSpinningDown={isSpinningDown}
            progress={progress}
            duration={duration}
            onPlayPause={onPlayPause}
            onPause={onPause}
            onResume={onResume}
            onSeek={onSeek}
            seekNudgeFeedback={seekNudgeFeedback}
            masterVolume={masterVolume}
            onMasterVolumeChange={onMasterVolumeChange}
            onSkipNext={onSkipNext}
            onSkipBack={onSkipBack}
            loopAll={loopAll}
            onLoopAllToggle={onLoopAllToggle}
            canStartFromQueue={canStartFromQueue}
            emptyTrackMessage={emptyTrackMessage}
            showBackButton={showBackButton}
            isTransitioning={isTransitioning}
            transitionWidth={isTransitioning ? FULL_PLAYER_WIDTH : primaryWidth}
            compactTitle={isTransitioning}
            isPlayerCollapsed={isPlayerCollapsed}
          />
        </div>

        {showIncomingPanel && incomingTrack && (
          <div
            key={incomingTrack.id}
            className={`box-border min-w-0 overflow-hidden will-change-[flex-basis,max-width,transform] ${
              isTransitionSettling ? "absolute inset-0 z-20" : incomingPanelHidden ? "" : "border-l border-border"
            }`}
            style={{
              flexBasis: isTransitionSettling ? FULL_PLAYER_WIDTH : incomingPanelWidth,
              maxWidth: isTransitionSettling ? FULL_PLAYER_WIDTH : incomingPanelWidth,
              paddingLeft: isTransitionSettling
                ? 0
                : primaryWidth === HIDDEN_PLAYER_WIDTH || incomingPanelHidden
                  ? 0
                  : PLAYER_COLUMN_GAP,
              transform: isTransitionSettling
                ? "translateX(0)"
                : incomingPanelHidden
                  ? "translateX(4rem)"
                  : "translateX(0)",
              transition: PLAYER_PANEL_TRANSITION,
            }}
          >
            <VinylPlayer
              track={incomingTrack}
              isPlaying={incomingPlaying}
              isSpinningDown={false}
              progress={incomingProgress}
              duration={incomingDuration}
              onPlayPause={onSecondaryPlayPause}
              onPause={onSecondaryPause}
              onResume={onSecondaryResume}
              onSeek={onSecondarySeek}
              seekNudgeFeedback={null}
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              showVolumeControl={false}
              onSkipNext={noop}
              loopAll={loopAll}
              onLoopAllToggle={noop}
              canStartFromQueue={false}
              showBackButton={false}
              isTransitioning={true}
              transitionWidth={FULL_PLAYER_WIDTH}
              compactTitle
              isPlayerCollapsed={isPlayerCollapsed}
            />
          </div>
        )}
      </div>
    </div>
  )
}
