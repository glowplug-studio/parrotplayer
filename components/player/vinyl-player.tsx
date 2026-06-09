"use client"

import { useEffect, useRef, type MouseEvent } from "react"
import { Pause, Play, SkipBack, SkipForward } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Track } from "@/lib/player/types"

type VinylPlayerProps = {
  deckId: string
  track: Track | null
  isPlaying: boolean
  isSpinningDown?: boolean
  progress: number
  duration: number
  onPlayPause: () => void
  onSeek: (percentage: number) => void
  onSkipNext: () => void
  onSkipBack?: () => void
  showBackButton: boolean
  isTransitioning?: boolean
  transitionWidth?: string
  compactTitle?: boolean
  spinAngleSeed?: number
  spinVelocitySeed?: number
  onSpinStateChange?: (angle: number, velocity: number) => void
}

export function VinylPlayer({
  deckId,
  track,
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
  transitionWidth,
  compactTitle,
  spinAngleSeed = 0,
  spinVelocitySeed = 0,
  onSpinStateChange,
}: VinylPlayerProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const spinAnimationRef = useRef<number | null>(null)
  const spinAngleRef = useRef(0)
  const spinVelocityRef = useRef(0)
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0
  const progressTrackKey = track?.videoId ?? "empty"

  useEffect(() => {
    spinAngleRef.current = spinAngleSeed
    spinVelocityRef.current = spinVelocitySeed
    if (discRef.current) {
      discRef.current.style.transform = `rotate(${spinAngleRef.current}deg)`
    }
  }, [deckId, spinAngleSeed, spinVelocitySeed])

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    onSeek(percentage)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (spinAnimationRef.current) {
      cancelAnimationFrame(spinAnimationRef.current)
      spinAnimationRef.current = null
    }

    if (!isPlaying && !isSpinningDown) {
      spinVelocityRef.current = 0
      return
    }

    let lastTimestamp: number | null = null
    if (isPlaying) {
      spinVelocityRef.current = 90
    } else if (spinVelocityRef.current <= 0) {
      spinVelocityRef.current = 90
    }

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp
      }

      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
      lastTimestamp = timestamp

      if (isSpinningDown && !isPlaying) {
        spinVelocityRef.current *= Math.exp(-deltaSeconds * 1.35)
      } else {
        spinVelocityRef.current = 90
      }

      spinAngleRef.current = (spinAngleRef.current + spinVelocityRef.current * deltaSeconds) % 360
      if (discRef.current) {
        discRef.current.style.transform = `rotate(${spinAngleRef.current}deg)`
      }
      onSpinStateChange?.(spinAngleRef.current, spinVelocityRef.current)

      if (isPlaying || spinVelocityRef.current > 2) {
        spinAnimationRef.current = requestAnimationFrame(animate)
      } else {
        spinVelocityRef.current = 0
        onSpinStateChange?.(spinAngleRef.current, spinVelocityRef.current)
        spinAnimationRef.current = null
      }
    }

    spinAnimationRef.current = requestAnimationFrame(animate)

    return () => {
      if (spinAnimationRef.current) {
        cancelAnimationFrame(spinAnimationRef.current)
        spinAnimationRef.current = null
      }
    }
  }, [isPlaying, isSpinningDown, onSpinStateChange])

  return (
    <div
      className={`flex flex-col items-center transition-[width] duration-700 ease-in-out overflow-hidden ${isTransitioning ? "shrink-0" : "flex-1"}`}
      style={isTransitioning ? { width: transitionWidth, minWidth: "0" } : {}}
    >
      <div className="relative w-48 h-48 mb-6 z-10">
        <div className="absolute inset-0 rounded-full bg-zinc-950 shadow-2xl" />
        <div className="absolute inset-1 rounded-full bg-zinc-900" />
        <div
          ref={discRef}
          className="absolute inset-2 rounded-full overflow-hidden shadow-inner"
        >
          {track ? (
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-zinc-900" />
            </div>
          )}
        </div>
        <div className="absolute inset-[5.5rem] rounded-full bg-zinc-950 border-2 border-zinc-800" />
      </div>

      <h3
        className={`mb-4 min-h-[4.5rem] text-center text-3xl font-bold leading-tight text-balance line-clamp-2 z-10 overflow-hidden transition-[max-width] duration-700 ease-in-out ${
          compactTitle ? "w-full max-w-[16rem]" : "w-full max-w-md"
        }`}
      >
        {track?.title || "No track playing"}
      </h3>

      <div className="w-full max-w-md z-10">
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="relative h-2 bg-muted rounded-full border border-border cursor-pointer group"
        >
          <div
            key={`fill-${progressTrackKey}`}
            className="absolute h-full bg-primary rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            key={`playhead-${progressTrackKey}`}
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 z-10">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkipBack}
            className="h-10 w-10"
            data-tooltip-id="player-tooltip"
            data-tooltip-content="Play previous track"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onPlayPause}
          disabled={!track}
          className="h-12 w-12 rounded-full"
          data-tooltip-id="player-tooltip"
          data-tooltip-content={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipNext}
          className="h-10 w-10"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Skip to next track"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
