"use client"

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react"
import { Pause, Play, Repeat, SkipBack, SkipForward, Volume2 } from "lucide-react"
import AnimateHeight from "react-animate-height"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import type { Track } from "@/lib/player/types"

const PLAYBACK_ROTATION_DURATION_MS = 4000
const recordSpinPhases = new Map<string, { startAngle: number; startedAt: number; isRunning: boolean }>()

function InlineTitleLoadingRing() {
  return (
    <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AnimatedTitleContent({ title, isLoading }: { title: string; isLoading: boolean }) {
  return (
    <>
      <AnimateHeight duration={220} height={isLoading ? "auto" : 0} easing="cubic-bezier(0.34, 1.56, 0.64, 1)">
        <span className="flex min-h-5 items-center justify-center">
          <InlineTitleLoadingRing />
        </span>
      </AnimateHeight>
      <AnimateHeight duration={220} height={isLoading ? 0 : "auto"} easing="cubic-bezier(0.34, 1.56, 0.64, 1)">
        <span>{title}</span>
      </AnimateHeight>
    </>
  )
}

function clampPercentage(value: number) {
  return Math.min(1, Math.max(0, value))
}

type VinylPlayerProps = {
  track: Track | null
  isPlaying: boolean
  isSpinningDown?: boolean | undefined
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
  onSkipBack?: (() => void) | undefined
  loopAll: boolean
  onLoopAllToggle: () => void
  canStartFromQueue: boolean
  showBackButton: boolean
  showVolumeControl?: boolean | undefined
  isTransitioning?: boolean | undefined
  transitionWidth?: string | undefined
  compactTitle?: boolean | undefined
  isPlayerCollapsed?: boolean | undefined
  emptyTrackMessage?: string
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
  isPlayerCollapsed = false,
  onHoldStart,
}: {
  track: Track | null
  isPlaying: boolean
  isSpinningDown?: boolean | undefined
  isPlayerCollapsed?: boolean | undefined
  onHoldStart: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  const t = useTranslations("Player")
  const discRef = useRef<HTMLDivElement>(null)
  const spinDownAnimationRef = useRef<number | null>(null)
  const playbackAnimationRef = useRef<Animation | null>(null)
  const spinAngleRef = useRef(0)
  const spinVelocityRef = useRef(0)
  const videoId = track?.videoId ?? null
  const latestVideoIdRef = useRef(videoId)
  const latestIsPlayingRef = useRef(isPlaying)
  const [isHoldingRecord, setIsHoldingRecord] = useState(false)
  const recordCursorClass = isHoldingRecord ? "cursor-grabbing" : "cursor-grab"

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
    const disc = discRef.current

    return () => {
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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return

    setIsHoldingRecord(true)
    onHoldStart(event)
  }

  const handlePointerRelease = () => {
    setIsHoldingRecord(false)
  }

  return (
    <button
      type="button"
      className={`relative z-10 select-none appearance-none border-0 bg-transparent p-0 transition-[width,height,margin] duration-300 max-[399px]:mb-3 max-[399px]:h-[7.2rem] max-[399px]:w-[7.2rem] ${
        isPlayerCollapsed ? "m-0 h-16 w-16 drop-shadow-[0_0_14px_rgb(239_68_68/0.65)]" : "mb-6 h-48 w-48"
      } ${recordCursorClass}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onLostPointerCapture={handlePointerRelease}
      aria-label={track ? t("holdRecord") : t("noRecord")}
    >
      <div className={`absolute inset-0 rounded-full bg-zinc-950 shadow-2xl ${recordCursorClass}`} />
      <div className={`absolute inset-1 rounded-full bg-zinc-900 ${recordCursorClass}`} />
      <div
        ref={discRef}
        className={`absolute inset-2 rounded-full overflow-hidden shadow-inner will-change-transform ${recordCursorClass}`}
        style={
          track
            ? {
                backgroundImage: `url(${track.thumbnail})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        {track ? (
          <span className="sr-only">{track.title}</span>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-zinc-900" />
          </div>
        )}
      </div>
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-800 bg-zinc-950 max-[399px]:h-3 max-[399px]:w-3 ${
          isPlayerCollapsed ? "h-2 w-2" : "h-4 w-4"
        } ${recordCursorClass}`}
      />
    </button>
  )
})

function formatPlaybackTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function PlaybackProgress({
  progress,
  duration,
  seekNudgeFeedback,
  onSeek,
  compact = false,
  trackKey,
}: {
  progress: number
  duration: number
  seekNudgeFeedback: { id: number; label: string } | null
  onSeek: (percentage: number) => void
  compact?: boolean
  trackKey: string
}) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return
    const rect = progressBarRef.current.getBoundingClientRect()
    if (rect.width <= 0) return

    const x = event.clientX - rect.left
    const percentage = clampPercentage(x / rect.width)
    onSeek(percentage)
  }

  return (
    <div
      className={
        compact
          ? "z-10 w-full max-w-sm overflow-visible"
          : "z-10 w-full max-w-md overflow-visible px-2 transition-[max-width] duration-300"
      }
    >
      <div
        ref={progressBarRef}
        onClick={handleSeek}
        className={`group relative cursor-pointer rounded-full border border-border bg-muted ${
          compact ? "h-1.5" : "h-2"
        }`}
      >
        <div
          key={`fill-${trackKey}`}
          className="absolute h-full rounded-full bg-primary"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          key={`playhead-${trackKey}`}
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
            compact ? "h-3 w-3" : "h-4 w-4"
          }`}
          style={{ left: `calc(${progressPercent}% - ${compact ? "6px" : "8px"})` }}
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
      <div className={`flex justify-between text-xs text-muted-foreground ${compact ? "mt-0.5" : "mt-1"}`}>
        <span>{formatPlaybackTime(progress)}</span>
        <span>{formatPlaybackTime(duration)}</span>
      </div>
    </div>
  )
}

function MasterVolumeControl({
  masterVolume,
  onMasterVolumeChange,
  isTransitioning,
  compact = false,
}: {
  masterVolume: number
  onMasterVolumeChange: (volume: number) => void
  isTransitioning?: boolean | undefined
  compact?: boolean | undefined
}) {
  const t = useTranslations("Player")

  return (
    <label
      className={`flex cursor-pointer items-center text-muted-foreground transition-opacity duration-300 ${
        compact ? "mr-1 w-20 gap-1.5" : "w-24 gap-2"
      } ${isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"}`}
      data-tooltip-id="player-tooltip"
      data-tooltip-content={t("masterVolume", { volume: masterVolume })}
    >
      <Volume2 className={`shrink-0 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
      <input
        type="range"
        min={0}
        max={100}
        value={masterVolume}
        onChange={(event) => onMasterVolumeChange(Number(event.target.value))}
        className={`w-full cursor-pointer accent-primary ${compact ? "h-1.5" : "h-2"}`}
        aria-label={t("masterVolumeLabel")}
      />
    </label>
  )
}

function PlayerControls({
  isPlaying,
  canPlay,
  showBackButton,
  showVolumeControl,
  isTransitioning,
  masterVolume,
  onMasterVolumeChange,
  onPlayPause,
  onSkipBack,
  onSkipNext,
  loopAll,
  onLoopAllToggle,
  compact = false,
}: {
  isPlaying: boolean
  canPlay: boolean
  showBackButton: boolean
  showVolumeControl: boolean
  isTransitioning?: boolean | undefined
  masterVolume: number
  onMasterVolumeChange: (volume: number) => void
  onPlayPause: () => void
  onSkipBack?: (() => void) | undefined
  onSkipNext: () => void
  loopAll: boolean
  onLoopAllToggle: () => void
  compact?: boolean | undefined
}) {
  const t = useTranslations("Player")
  const backButton = showBackButton ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={onSkipBack}
      className={compact ? "h-8 w-8" : "h-10 w-10"}
      aria-label={t("previous")}
      data-tooltip-id="player-tooltip"
      data-tooltip-content={t("previous")}
    >
      <SkipBack className={compact ? "h-4 w-4" : "h-5 w-5"} />
    </Button>
  ) : (
    <div className={compact ? "h-8 w-8" : "h-10 w-10"} />
  )
  const playButton = (
    <Button
      variant="outline"
      size="icon"
      onClick={onPlayPause}
      disabled={!canPlay}
      className={`${compact ? "h-9 w-9" : "h-12 w-12"} rounded-full`}
      aria-label={isPlaying ? t("pause") : t("play")}
      data-tooltip-id="player-tooltip"
      data-tooltip-content={isPlaying ? t("pause") : t("play")}
    >
      {isPlaying ? (
        <Pause className={compact ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <Play className={`${compact ? "h-4 w-4" : "h-5 w-5"} ml-0.5`} />
      )}
    </Button>
  )
  const nextButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onSkipNext}
      className={compact ? "h-8 w-8" : "h-10 w-10"}
      aria-label={t("next")}
      data-tooltip-id="player-tooltip"
      data-tooltip-content={t("next")}
    >
      <SkipForward className={compact ? "h-4 w-4" : "h-5 w-5"} />
    </Button>
  )
  const loopButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onLoopAllToggle}
      className={`${compact ? "h-8 w-8" : "h-10 w-10"} ${loopAll ? "text-primary" : ""}`}
      aria-label={loopAll ? t("loopOff") : t("loopOn")}
      data-tooltip-id="player-tooltip"
      data-tooltip-content={loopAll ? t("loopOff") : t("loopOn")}
      aria-pressed={loopAll}
    >
      <Repeat className={compact ? "h-4 w-4" : "h-5 w-5"} />
    </Button>
  )

  if (compact) {
    return (
      <div className="z-10 mt-1 flex w-full max-w-sm items-center gap-1.5 overflow-visible">
        {showVolumeControl && (
          <MasterVolumeControl
            masterVolume={masterVolume}
            onMasterVolumeChange={onMasterVolumeChange}
            isTransitioning={isTransitioning}
            compact
          />
        )}
        {backButton}
        {playButton}
        {nextButton}
        {loopButton}
      </div>
    )
  }

  return (
    <div className="z-10 mt-4 grid w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 overflow-visible transition-[max-width,margin] duration-300">
      <div className="justify-self-end">
        {showVolumeControl && (
          <MasterVolumeControl
            masterVolume={masterVolume}
            onMasterVolumeChange={onMasterVolumeChange}
            isTransitioning={isTransitioning}
          />
        )}
      </div>

      <div className="grid grid-cols-[2.5rem_3rem_2.5rem_2.5rem] items-center gap-3 overflow-visible">
        {backButton}
        {playButton}
        {nextButton}
        {loopButton}
      </div>

      <div />
    </div>
  )
}

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
  loopAll,
  onLoopAllToggle,
  canStartFromQueue,
  showBackButton,
  showVolumeControl = true,
  isTransitioning,
  transitionWidth,
  compactTitle,
  isPlayerCollapsed = false,
  emptyTrackMessage,
}: VinylPlayerProps) {
  const t = useTranslations("Player")
  const holdPausedRef = useRef(false)
  const latestResumeRef = useRef(onResume)
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

  const isTitleLoading = Boolean(track?.isTitleLoading)
  const titleText = track?.title || (canStartFromQueue ? t("clickPlay") : (emptyTrackMessage ?? t("noTrack")))
  const canPlay = Boolean(track) || canStartFromQueue
  const isEmptyInstructionMessage = !track && !canStartFromQueue && Boolean(emptyTrackMessage)

  if (isPlayerCollapsed) {
    return (
      <div
        className={`relative flex min-h-0 flex-1 items-stretch overflow-hidden transition-[width] duration-700 ease-in-out ${isTransitioning ? "shrink-0" : ""}`}
        style={isTransitioning ? { width: transitionWidth, minWidth: "0" } : {}}
      >
        <div className="flex w-24 shrink-0 items-center justify-center self-stretch">
          <SpinningRecord
            track={track}
            isPlaying={isPlaying}
            isSpinningDown={isSpinningDown}
            isPlayerCollapsed={isPlayerCollapsed}
            onHoldStart={handleRecordHoldStart}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-2">
          <div
            role="heading"
            aria-level={3}
            className={`z-10 mb-1 min-h-5 w-full overflow-hidden truncate text-left font-medium leading-tight ${
              isEmptyInstructionMessage ? "text-xs" : "text-sm"
            }`}
          >
            <AnimatedTitleContent title={titleText} isLoading={isTitleLoading} />
          </div>

          <PlaybackProgress
            progress={progress}
            duration={duration}
            seekNudgeFeedback={seekNudgeFeedback}
            onSeek={onSeek}
            trackKey={progressTrackKey}
            compact
          />

          <PlayerControls
            isPlaying={isPlaying}
            canPlay={canPlay}
            showBackButton={showBackButton}
            showVolumeControl={showVolumeControl}
            isTransitioning={isTransitioning}
            masterVolume={masterVolume}
            onMasterVolumeChange={onMasterVolumeChange}
            onPlayPause={onPlayPause}
            onSkipBack={onSkipBack}
            onSkipNext={onSkipNext}
            loopAll={loopAll}
            onLoopAllToggle={onLoopAllToggle}
            compact
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative flex flex-col items-center overflow-hidden transition-[width] duration-700 ease-in-out ${isTransitioning ? "shrink-0" : "flex-1"}`}
      style={isTransitioning ? { width: transitionWidth, minWidth: "0" } : {}}
    >
      <SpinningRecord
        track={track}
        isPlaying={isPlaying}
        isSpinningDown={isSpinningDown}
        isPlayerCollapsed={isPlayerCollapsed}
        onHoldStart={handleRecordHoldStart}
      />

      <div
        role="heading"
        aria-level={3}
        className={`z-10 overflow-hidden text-balance text-center font-bold leading-tight transition-[max-width,font-size,min-height,margin] duration-300 ease-in-out max-[399px]:pointer-events-none max-[399px]:absolute max-[399px]:left-1/2 max-[399px]:top-[3.6rem] max-[399px]:mb-0 max-[399px]:min-h-0 max-[399px]:-translate-x-1/2 max-[399px]:-translate-y-1/2 max-[399px]:rounded-md max-[399px]:bg-black/50 max-[399px]:px-3 max-[399px]:py-1.5 max-[399px]:text-base max-[399px]:leading-tight max-[399px]:backdrop-blur-sm ${
          isPlayerCollapsed
            ? "mb-2 min-h-5 text-xs line-clamp-1"
            : isEmptyInstructionMessage
              ? "mb-3 min-h-8 text-base font-medium line-clamp-2 max-[399px]:text-xs"
              : "mb-4 min-h-[4.5rem] text-3xl line-clamp-2"
        } ${
          compactTitle || isPlayerCollapsed || isEmptyInstructionMessage
            ? "w-full max-w-[16rem] max-[399px]:max-w-full"
            : "w-full max-w-md max-[399px]:max-w-full"
        }`}
      >
        <AnimatedTitleContent title={titleText} isLoading={isTitleLoading} />
      </div>

      <PlaybackProgress
        progress={progress}
        duration={duration}
        seekNudgeFeedback={seekNudgeFeedback}
        onSeek={onSeek}
        trackKey={progressTrackKey}
      />

      <PlayerControls
        isPlaying={isPlaying}
        canPlay={canPlay}
        showBackButton={showBackButton}
        showVolumeControl={showVolumeControl}
        isTransitioning={isTransitioning}
        masterVolume={masterVolume}
        onMasterVolumeChange={onMasterVolumeChange}
        onPlayPause={onPlayPause}
        onSkipBack={onSkipBack}
        onSkipNext={onSkipNext}
        loopAll={loopAll}
        onLoopAllToggle={onLoopAllToggle}
      />
    </div>
  )
}
