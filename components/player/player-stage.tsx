"use client"

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
import type { DeckId, DeckMap, Track } from "@/lib/player/types"
import { VinylPlayer } from "@/components/player/vinyl-player"

type PlayerStageProps = {
  activeDeck: DeckId
  currentTrack: Track | null
  isPlaying: boolean
  isSpinningDown: boolean
  progress: number
  duration: number
  onPlayPause: () => void
  onSeek: (percentage: number) => void
  onSkipNext: () => void
  onSkipBack: () => void
  showBackButton: boolean
  isTransitioning: boolean
  isTransitionSettling: boolean
  primaryWidth: string
  incomingPanelWidth: string
  incomingDeck: DeckId
  incomingTrack: Track | null
  incomingProgress: number
  incomingDuration: number
  incomingPlaying: boolean
  onSecondaryPlayPause: () => void
  onSecondarySeek: (percentage: number) => void
  spinAngles: DeckMap<number>
  spinVelocities: DeckMap<number>
  onSpinStateChange: (deck: DeckId, angle: number, velocity: number) => void
  backgroundLayers: [string | null, string | null]
  visibleBackgroundLayer: 0 | 1
  fadingBackgroundLayer: 0 | 1 | null
}

export function PlayerStage({
  activeDeck,
  currentTrack,
  isPlaying,
  isSpinningDown,
  progress,
  duration,
  onPlayPause,
  onSeek,
  onSkipNext,
  onSkipBack,
  showBackButton,
  isTransitioning,
  isTransitionSettling,
  primaryWidth,
  incomingPanelWidth,
  incomingDeck,
  incomingTrack,
  incomingProgress,
  incomingDuration,
  incomingPlaying,
  onSecondaryPlayPause,
  onSecondarySeek,
  spinAngles,
  spinVelocities,
  onSpinStateChange,
  backgroundLayers,
  visibleBackgroundLayer,
  fadingBackgroundLayer,
}: PlayerStageProps) {
  const incomingPanelHidden = incomingPanelWidth === HIDDEN_PLAYER_WIDTH
  const showIncomingPanel = (isTransitioning || isTransitionSettling) && incomingTrack

  return (
    <div className="relative isolate flex min-h-[29rem] shrink-0 flex-col overflow-hidden border-b border-border p-8">
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

      <div
        className={`relative z-10 flex ${isTransitioning ? PLAYER_GAP_TRANSITION_CLASS : ""}`}
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
            deckId={activeDeck}
            track={currentTrack}
            isPlaying={isPlaying}
            isSpinningDown={isSpinningDown}
            progress={progress}
            duration={duration}
            onPlayPause={onPlayPause}
            onSeek={onSeek}
            onSkipNext={onSkipNext}
            onSkipBack={onSkipBack}
            showBackButton={showBackButton}
            isTransitioning={isTransitioning}
            transitionWidth={isTransitioning ? FULL_PLAYER_WIDTH : primaryWidth}
            compactTitle={isTransitioning}
            spinAngleSeed={spinAngles[activeDeck]}
            spinVelocitySeed={spinVelocities[activeDeck]}
            onSpinStateChange={(angle, velocity) => onSpinStateChange(activeDeck, angle, velocity)}
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
              deckId={incomingDeck}
              track={incomingTrack}
              isPlaying={incomingPlaying}
              isSpinningDown={false}
              progress={incomingProgress}
              duration={incomingDuration}
              onPlayPause={onSecondaryPlayPause}
              onSeek={onSecondarySeek}
              onSkipNext={() => {}}
              showBackButton={false}
              isTransitioning={true}
              transitionWidth={FULL_PLAYER_WIDTH}
              compactTitle
              spinAngleSeed={spinAngles[incomingDeck]}
              spinVelocitySeed={spinVelocities[incomingDeck]}
              onSpinStateChange={(angle, velocity) => onSpinStateChange(incomingDeck, angle, velocity)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
