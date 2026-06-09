"use client"

import { memo, useCallback, useEffect, useLayoutEffect, useRef, type MouseEvent, type PointerEvent } from "react"
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import type { Track } from "@/lib/player/types"

const PLAYBACK_ROTATION_DURATION_MS = 4000
const recordSpinPhases = new Map<string, { startAngle: number; startedAt: number; isRunning: boolean }>()

type VinylPlayerProps = {
  track: Track | null
  isPlaying: boolean
  isSpinningDown?: boolean
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
  onSkipBack?: () => void
  showBackButton: boolean
  showVolumeControl?: boolean
  isTransitioning?: boolean
  transitionWidth?: string
  compactTitle?: boolean
}

function getElementRotation(element: HTMLElement) {
  const transform = window.getComputedStyle(element).transform
  if (!transform || transform === "none") return 0

  const matrix = new DOMMatrixReadOnly(transform)
  const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI)
  return angle < 0 ? angle + 360 : angle
}

function getCachedPlaybackRotation(videoId: string) {
  const phase = recordSpinPhases.get(videoId)
  if (!phase) return null
  if (!phase.isRunning) return phase.startAngle

  const elapsedRatio = (performance.now() - phase.startedAt) / PLAYBACK_ROTATION_DURATION_MS
  return (phase.startAngle + elapsedRatio * 360) % 360
}

function setCachedPlaybackRotation(videoId: string, startAngle: number, isRunning: boolean) {
  recordSpinPhases.set(videoId, { startAngle, startedAt: performance.now(), isRunning })
}

const SpinningRecord = memo(function SpinningRecord({
  track,
  isPlaying,
  isSpinningDown,
  onHoldStart,
}: {
  track: Track | null
  isPlaying: boolean
  isSpinningDown?: boolean
  onHoldStart: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  const discRef = useRef<HTMLDivElement>(null)
  const spinDownAnimationRef = useRef<number | null>(null)
  const playbackAnimationRef = useRef<Animation | null>(null)
  const spinAngleRef = useRef(0)
  const spinVelocityRef = useRef(0)
  const videoId = track?.videoId ?? null
  const latestVideoIdRef = useRef(videoId)
  const latestIsPlayingRef = useRef(isPlaying)

  useEffect(() => {
    latestVideoIdRef.current = videoId
    latestIsPlayingRef.current = isPlaying
  }, [isPlaying, videoId])

  useLayoutEffect(() => {
    const disc = discRef.current
    if (!disc) return

    if (spinDownAnimationRef.current) {
      cancelAnimationFrame(spinDownAnimationRef.current)
      spinDownAnimationRef.current = null
    }

    if (isPlaying) {
      const startAngle = videoId
        ? (getCachedPlaybackRotation(videoId) ?? getElementRotation(disc))
        : getElementRotation(disc)
      spinAngleRef.current = startAngle
      spinVelocityRef.current = 90
      if (videoId) {
        setCachedPlaybackRotation(videoId, startAngle, true)
      }
      disc.style.transform = `translateZ(0) rotate(${startAngle}deg)`

      playbackAnimationRef.current?.cancel()
      playbackAnimationRef.current = disc.animate(
        [
          { transform: `translateZ(0) rotate(${startAngle}deg)` },
          { transform: `translateZ(0) rotate(${startAngle + 360}deg)` },
        ],
        {
          duration: PLAYBACK_ROTATION_DURATION_MS,
          easing: "linear",
          iterations: Infinity,
        }
      )
      return
    }

    if (playbackAnimationRef.current) {
      spinAngleRef.current = getElementRotation(disc)
      if (videoId) {
        setCachedPlaybackRotation(videoId, spinAngleRef.current, false)
      }
      playbackAnimationRef.current.cancel()
      playbackAnimationRef.current = null
      disc.style.transform = `translateZ(0) rotate(${spinAngleRef.current}deg)`
    }

    if (!isSpinningDown) {
      spinVelocityRef.current = 0
      return
    }

    let lastTimestamp: number | null = null
    if (spinVelocityRef.current <= 0) {
      spinVelocityRef.current = 90
    }

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp
      }

      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
      lastTimestamp = timestamp

      spinVelocityRef.current *= Math.exp(-deltaSeconds * 1.35)

      spinAngleRef.current = (spinAngleRef.current + spinVelocityRef.current * deltaSeconds) % 360
      disc.style.transform = `translateZ(0) rotate(${spinAngleRef.current}deg)`

      if (spinVelocityRef.current > 2) {
        spinDownAnimationRef.current = requestAnimationFrame(animate)
      } else {
        spinVelocityRef.current = 0
        spinDownAnimationRef.current = null
      }
    }

    spinDownAnimationRef.current = requestAnimationFrame(animate)
  }, [isPlaying, isSpinningDown, videoId])

  useEffect(() => {
    return () => {
      const disc = discRef.current
      const latestVideoId = latestVideoIdRef.current
      if (disc && latestVideoId) {
        setCachedPlaybackRotation(latestVideoId, getElementRotation(disc), latestIsPlayingRef.current)
      }

      if (spinDownAnimationRef.current) {
        cancelAnimationFrame(spinDownAnimationRef.current)
        spinDownAnimationRef.current = null
      }
      playbackAnimationRef.current?.cancel()
      playbackAnimationRef.current = null
    }
  }, [])

  return (
    <button
      type="button"
      className="relative w-48 h-48 mb-6 z-10 cursor-pointer select-none appearance-none border-0 bg-transparent p-0"
      onPointerDown={onHoldStart}
      aria-label={track ? "Hold record to pause" : "No record loaded"}
    >
      <div className="absolute inset-0 rounded-full bg-zinc-950 shadow-2xl" />
      <div className="absolute inset-1 rounded-full bg-zinc-900" />
      <div ref={discRef} className="absolute inset-2 rounded-full overflow-hidden shadow-inner will-change-transform">
        {track ? (
          <Image
            src={track.thumbnail}
            alt={track.title}
            width={176}
            height={176}
            priority
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-zinc-900" />
          </div>
        )}
      </div>
      <div className="absolute inset-[5.5rem] rounded-full bg-zinc-950 border-2 border-zinc-800" />
    </button>
  )
})

export function VinylPlayer({
  track,
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
  showBackButton,
  showVolumeControl = true,
  isTransitioning,
  transitionWidth,
  compactTitle,
}: VinylPlayerProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const holdPausedRef = useRef(false)
  const latestResumeRef = useRef(onResume)
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0
  const progressTrackKey = track?.videoId ?? "empty"

  useEffect(() => {
    latestResumeRef.current = onResume
  }, [onResume])

  useEffect(() => {
    const handleHoldRelease = () => {
      if (!holdPausedRef.current) return

      holdPausedRef.current = false
      latestResumeRef.current()
    }

    window.addEventListener("pointerup", handleHoldRelease)
    window.addEventListener("pointercancel", handleHoldRelease)

    return () => {
      window.removeEventListener("pointerup", handleHoldRelease)
      window.removeEventListener("pointercancel", handleHoldRelease)
    }
  }, [])

  const handleRecordHoldStart = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return
      if (!track || !isPlaying || holdPausedRef.current) return

      event.currentTarget.setPointerCapture(event.pointerId)
      holdPausedRef.current = true
      onPause()
    },
    [isPlaying, onPause, track]
  )

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

  return (
    <div
      className={`flex flex-col items-center overflow-hidden transition-[width] duration-700 ease-in-out ${isTransitioning ? "shrink-0" : "flex-1"}`}
      style={isTransitioning ? { width: transitionWidth, minWidth: "0" } : {}}
    >
      <SpinningRecord
        track={track}
        isPlaying={isPlaying}
        isSpinningDown={isSpinningDown}
        onHoldStart={handleRecordHoldStart}
      />

      <h3
        className={`mb-4 min-h-[4.5rem] text-center text-3xl font-bold leading-tight text-balance line-clamp-2 z-10 overflow-hidden transition-[max-width] duration-700 ease-in-out ${
          compactTitle ? "w-full max-w-[16rem]" : "w-full max-w-md"
        }`}
      >
        {track?.title || "No track playing"}
      </h3>

      <div className="w-full max-w-md px-2 z-10 overflow-visible">
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
          {seekNudgeFeedback && (
            <span
              key={seekNudgeFeedback.id}
              className="seek-nudge-feedback pointer-events-none absolute -top-9 z-20 -translate-x-1/2 rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground shadow-lg"
              style={{ left: `${progressPercent}%` }}
            >
              {seekNudgeFeedback.label}
            </span>
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="grid w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 mt-4 z-10 overflow-visible">
        <div className="justify-self-end">
          {showVolumeControl && (
            <label
              className={`flex w-24 cursor-pointer items-center gap-2 text-muted-foreground transition-opacity duration-300 ${
                isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
              data-tooltip-id="player-tooltip"
              data-tooltip-content={`Master volume ${masterVolume}%`}
            >
              <Volume2 className="h-4 w-4 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={masterVolume}
                onChange={(event) => onMasterVolumeChange(Number(event.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
                aria-label="Master volume"
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-[2.5rem_3rem_2.5rem] items-center gap-3 overflow-visible">
          {showBackButton ? (
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
          ) : (
            <div className="h-10 w-10" />
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

        <div />
      </div>
    </div>
  )
}
