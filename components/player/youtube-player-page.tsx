"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Slide, toast, ToastContainer } from "react-toastify"
import { Tooltip } from "react-tooltip"
import "react-toastify/dist/ReactToastify.css"
import "react-tooltip/dist/react-tooltip.css"

import { AddTrackForm } from "@/components/player/add-track-form"
import { HelpModal } from "@/components/player/help-modal"
import { PlayerHeader } from "@/components/player/player-header"
import { PlayerStage } from "@/components/player/player-stage"
import { TrackList } from "@/components/player/track-list"
import { TrackTabs } from "@/components/player/track-tabs"
import { useBackgroundCrossfade } from "@/hooks/player/use-background-crossfade"
import { usePlayerSettingsStorage } from "@/hooks/player/use-player-settings-storage"
import { DEFAULT_PLAYER_TITLE, usePlayerTitleStorage } from "@/hooks/player/use-player-title-storage"
import { usePlaylistStorage } from "@/hooks/player/use-playlist-storage"
import { useSingleToast } from "@/hooks/player/use-single-toast"
import {
  DECK_IDS,
  DEFAULT_OVERLAP,
  FULL_PLAYER_WIDTH,
  HIDDEN_PLAYER_WIDTH,
  KEYBOARD_SEEK_STEP_SECONDS,
  MAX_DECK_VOLUME,
  METADATA_DURATION_MAX_RETRIES,
  METADATA_DURATION_RETRY_DELAY_MS,
  MIN_DECK_VOLUME,
  MUTED_PLAY_RETRY_DELAYS_MS,
  NO_OVERLAP_PULSE_LEAD_SECONDS,
  OUTGOING_FADE_WINDOW_MULTIPLIER,
  OVERLAP_PULSE_EXTRA_SECONDS,
  PLAYER_PANEL_TRANSITION_MS,
  PLAYER_SETTLE_DELAY_MS,
  PLAY_RETRY_DELAYS_MS,
  PREBUFFER_FINALIZE_DELAYS_MS,
  PREBUFFER_STATE_SETTLE_MS,
  PROGRESS_POLL_MS,
  SPLIT_PLAYER_WIDTH,
  TRACK_END_PLAY_DELAY_MS,
  VISUAL_TRANSITION_LEAD_SECONDS,
} from "@/lib/player/constants"
import { createDeckListMap, createDeckMap } from "@/lib/player/deck-map"
import { addPlayedTrackToHistory, sortHistoryByPlayedTime } from "@/lib/player/history"
import { formatTotalDuration } from "@/lib/player/time"
import type { DeckId, DeckMap, OverlapSetting, Track, YouTubePlayer } from "@/lib/player/types"
import {
  extractVideoId,
  PLAYER_TITLE_STORAGE_KEY,
  PLAYLIST_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from "@/lib/player/youtube"

function shouldApplyTrackDurationMetadata(track: Track, durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return false

  return typeof track.durationSeconds !== "number" || Math.abs(track.durationSeconds - durationSeconds) >= 1
}

export function YouTubePlayerPage() {
  const [queue, setQueue] = useState<Track[]>([])
  const [history, setHistory] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [urlInput, setUrlInput] = useState("")
  const [urlError, setUrlError] = useState("")
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue")
  const [autoplay, setAutoplay] = useState(true)
  const [playerReady, setPlayerReady] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [playerTitle, setPlayerTitle] = usePlayerTitleStorage()
  const [overlap, setOverlap] = useState<OverlapSetting>(DEFAULT_OVERLAP)
  const [isPulsing, setIsPulsing] = useState(false)
  const [isSpinningDown, setIsSpinningDown] = useState(false)
  const [tooltipRoot, setTooltipRoot] = useState<HTMLElement | null>(null)
  const { backgroundLayers, visibleBackgroundLayer, fadingBackgroundLayer, crossfadeBackgroundTo } =
    useBackgroundCrossfade()
  const showSingleSuccessToast = useSingleToast()
  const hasLoadedStoredSettings = usePlayerSettingsStorage({ autoplay, setAutoplay, overlap, setOverlap })
  const hasLoadedStoredPlaylist = usePlaylistStorage({ queue, setQueue, history, setHistory })

  const [activeDeck, setActiveDeck] = useState<DeckId>("a")
  const [deckTracks, setDeckTracks] = useState<DeckMap<Track | null>>(() => createDeckMap<Track | null>(null))
  const [deckProgress, setDeckProgress] = useState<DeckMap<number>>(() => createDeckMap(0))
  const [deckDurations, setDeckDurations] = useState<DeckMap<number>>(() => createDeckMap(0))
  const [deckPlaying, setDeckPlaying] = useState<DeckMap<boolean>>(() => createDeckMap(false))
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isTransitionSettling, setIsTransitionSettling] = useState(false)
  const [primaryWidth, setPrimaryWidth] = useState(FULL_PLAYER_WIDTH)
  const [incomingPanelWidth, setIncomingPanelWidth] = useState(HIDDEN_PLAYER_WIDTH)
  const [deckReady, setDeckReady] = useState<DeckMap<boolean>>(() => createDeckMap(false))
  const [masterVolume, setMasterVolume] = useState(MAX_DECK_VOLUME)
  const [seekNudgeFeedback, setSeekNudgeFeedback] = useState<{ id: number; label: string } | null>(null)

  const playerRefs = useRef<DeckMap<YouTubePlayer | null>>(createDeckMap<YouTubePlayer | null>(null))
  const metadataPlayerRef = useRef<YouTubePlayer | null>(null)
  const metadataQueueRef = useRef<string[]>([])
  const pendingMetadataVideoIdRef = useRef<string | null>(null)
  const metadataRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metadataRetryCountRef = useRef(0)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const seekNudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seekNudgeIdRef = useRef(0)
  const playRetryTimeouts = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef = useRef<Track[]>([])
  const overlapRef = useRef(overlap)
  const masterVolumeRef = useRef(MAX_DECK_VOLUME)
  const activeDeckRef = useRef<DeckId>("a")
  const deckTracksRef = useRef<DeckMap<Track | null>>(createDeckMap<Track | null>(null))
  const deckProgressRef = useRef<DeckMap<number>>(createDeckMap(0))
  const deckDurationsRef = useRef<DeckMap<number>>(createDeckMap(0))
  const deckPlayingRef = useRef<DeckMap<boolean>>(createDeckMap(false))
  const transitionTriggered = useRef(false)
  const visualTransitionTriggered = useRef(false)
  const transitionCompleteTriggered = useRef(false)
  const apiReadyRef = useRef(false)
  const deckVolumeRef = useRef<DeckMap<number>>(createDeckMap(MAX_DECK_VOLUME))
  const pendingTransitionDeckRef = useRef<DeckId | null>(null)
  const pendingTransitionTrackRef = useRef<Track | null>(null)
  const handleTrackEndedRef = useRef<(() => void) | null>(null)
  const handleDeckEndedRef = useRef<((deck: DeckId) => void) | null>(null)
  const pendingInitialTrackRef = useRef<{ track: Track; shouldPlay: boolean } | null>(null)
  const hasAutoLoadedStoredTrack = useRef(false)
  const prebufferingDeckRef = useRef<DeckMap<string | null>>(createDeckMap<string | null>(null))
  const prebufferedDeckRef = useRef<DeckMap<string | null>>(createDeckMap<string | null>(null))
  const prebufferTimeoutsRef =
    useRef<DeckMap<Array<ReturnType<typeof setTimeout>>>>(createDeckListMap<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    setTooltipRoot(document.body)
  }, [])

  // Keep refs in sync
  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    crossfadeBackgroundTo(currentTrack?.thumbnail ?? null)
  }, [currentTrack?.thumbnail, crossfadeBackgroundTo])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    activeDeckRef.current = activeDeck
    const activeTrack = deckTracksRef.current[activeDeck]
    currentTrackRef.current = activeTrack
    setCurrentTrack(activeTrack)
    setProgress(deckProgress[activeDeck])
    setDuration(deckDurations[activeDeck])
    setIsPlaying(deckPlaying[activeDeck])
  }, [activeDeck, deckDurations, deckPlaying, deckProgress])

  useEffect(() => {
    deckTracksRef.current = deckTracks
    const activeTrack = deckTracks[activeDeckRef.current]
    currentTrackRef.current = activeTrack
    setCurrentTrack(activeTrack)
  }, [deckTracks])

  useEffect(() => {
    deckProgressRef.current = deckProgress
  }, [deckProgress])

  useEffect(() => {
    deckDurationsRef.current = deckDurations
  }, [deckDurations])

  useEffect(() => {
    deckPlayingRef.current = deckPlaying
  }, [deckPlaying])

  useEffect(() => {
    overlapRef.current = overlap
  }, [overlap])

  const overlapSeconds = overlap === "none" ? 0 : parseInt(overlap)

  const getOtherDeck = useCallback((deck: DeckId): DeckId => (deck === "a" ? "b" : "a"), [])

  const getDeckPlayer = useCallback((deck: DeckId) => playerRefs.current[deck], [])

  const showIncomingTransition = useCallback(() => {
    setIsTransitioning(true)
    setPrimaryWidth(FULL_PLAYER_WIDTH)
    setIncomingPanelWidth(HIDDEN_PLAYER_WIDTH)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPrimaryWidth(SPLIT_PLAYER_WIDTH)
        setIncomingPanelWidth(SPLIT_PLAYER_WIDTH)
      })
    })
  }, [])

  const setDeckVolume = useCallback(
    (deck: DeckId, volume: number) => {
      const nextVolume = Math.max(MIN_DECK_VOLUME, Math.min(MAX_DECK_VOLUME, Math.round(volume)))
      if (deckVolumeRef.current[deck] === nextVolume) return

      deckVolumeRef.current[deck] = nextVolume
      getDeckPlayer(deck)?.setVolume(nextVolume)
    },
    [getDeckPlayer]
  )

  const setActiveDeckVolume = useCallback(
    (volume: number) => {
      setDeckVolume(activeDeckRef.current, volume)
    },
    [setDeckVolume]
  )

  const handleMasterVolumeChange = useCallback(
    (volume: number) => {
      const nextVolume = Math.max(MIN_DECK_VOLUME, Math.min(MAX_DECK_VOLUME, Math.round(volume)))
      masterVolumeRef.current = nextVolume
      setMasterVolume(nextVolume)
      setDeckVolume(activeDeckRef.current, nextVolume)

      const incomingDeck = pendingTransitionDeckRef.current
      if (incomingDeck && incomingDeck !== activeDeckRef.current && deckPlayingRef.current[incomingDeck]) {
        setDeckVolume(incomingDeck, nextVolume)
      }
    },
    [setDeckVolume]
  )

  const resetDeckPlaybackState = useCallback((deck: DeckId) => {
    deckProgressRef.current = { ...deckProgressRef.current, [deck]: 0 }
    deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: 0 }
    deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: false }
    setDeckProgress((prev) => ({ ...prev, [deck]: 0 }))
    setDeckDurations((prev) => ({ ...prev, [deck]: 0 }))
    setDeckPlaying((prev) => ({ ...prev, [deck]: false }))
  }, [])

  const clearPlayRetries = useCallback(() => {
    playRetryTimeouts.current.forEach((timeout) => clearTimeout(timeout))
    playRetryTimeouts.current = []
  }, [])

  const applyDurationMetadata = useCallback((videoId: string, durationSeconds: number) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return

    const applyDuration = (track: Track) => {
      if (track.videoId !== videoId) return track
      if (typeof track.durationSeconds === "number" && Math.abs(track.durationSeconds - durationSeconds) < 1) {
        return track
      }

      return { ...track, durationSeconds }
    }

    setCurrentTrack((current) => (current ? applyDuration(current) : current))
    setDeckTracks((prev) => {
      const nextA = prev.a ? applyDuration(prev.a) : prev.a
      const nextB = prev.b ? applyDuration(prev.b) : prev.b
      if (nextA === prev.a && nextB === prev.b) return prev

      const nextDeckTracks = {
        a: nextA,
        b: nextB,
      }
      deckTracksRef.current = nextDeckTracks
      return nextDeckTracks
    })
    setQueue((prev) => {
      const nextQueue = prev.map(applyDuration)
      return nextQueue.some((track, index) => track !== prev[index]) ? nextQueue : prev
    })
    setHistory((prev) => {
      const nextHistory = prev.map(applyDuration)
      return nextHistory.some((track, index) => track !== prev[index]) ? sortHistoryByPlayedTime(nextHistory) : prev
    })

    if (pendingInitialTrackRef.current?.track.videoId === videoId) {
      const nextPendingTrack = applyDuration(pendingInitialTrackRef.current.track)
      if (nextPendingTrack !== pendingInitialTrackRef.current.track) {
        pendingInitialTrackRef.current = {
          ...pendingInitialTrackRef.current,
          track: nextPendingTrack,
        }
      }
    }
  }, [])

  const processNextMetadataTrack = useCallback(function processNextMetadataTrack() {
    const metadataPlayer = metadataPlayerRef.current
    if (!metadataPlayer || pendingMetadataVideoIdRef.current) return

    const nextVideoId = metadataQueueRef.current.shift()
    if (!nextVideoId) return

    pendingMetadataVideoIdRef.current = nextVideoId
    metadataRetryCountRef.current = 0
    try {
      metadataPlayer.mute()
      metadataPlayer.cueVideoById(nextVideoId)
    } catch {
      pendingMetadataVideoIdRef.current = null
      metadataRetryTimeoutRef.current = setTimeout(processNextMetadataTrack, METADATA_DURATION_RETRY_DELAY_MS)
    }
  }, [])

  const queueDurationMetadataLookup = useCallback(
    (track: Track) => {
      if (track.durationSeconds) return
      if (pendingMetadataVideoIdRef.current === track.videoId) return
      if (metadataQueueRef.current.includes(track.videoId)) return

      metadataQueueRef.current.push(track.videoId)
      processNextMetadataTrack()
    },
    [processNextMetadataTrack]
  )

  useEffect(() => {
    queue.forEach(queueDurationMetadataLookup)
  }, [queue, queueDurationMetadataLookup])

  useEffect(() => {
    history.forEach(queueDurationMetadataLookup)
  }, [history, queueDurationMetadataLookup])

  useEffect(() => {
    if (currentTrack) {
      queueDurationMetadataLookup(currentTrack)
    }
  }, [currentTrack, queueDurationMetadataLookup])

  const clearDeckPrebuffer = useCallback((deck: DeckId) => {
    prebufferTimeoutsRef.current[deck].forEach((timeout) => clearTimeout(timeout))
    prebufferTimeoutsRef.current[deck] = []
    prebufferingDeckRef.current = { ...prebufferingDeckRef.current, [deck]: null }
  }, [])

  const finalizeDeckPrebuffer = useCallback(
    (deck: DeckId, expectedVideoId?: string) => {
      const track = deckTracksRef.current[deck]
      const pendingVideoId = prebufferingDeckRef.current[deck]
      if (!track || !pendingVideoId) return
      if (expectedVideoId && pendingVideoId !== expectedVideoId) return

      const player = getDeckPlayer(deck)
      if (!player) return

      try {
        if (player.getVideoData().video_id !== pendingVideoId) return

        player.pauseVideo()
        player.seekTo(0, true)
        player.unMute()
        player.setVolume(masterVolumeRef.current)
        deckVolumeRef.current[deck] = masterVolumeRef.current

        const totalDuration = player.getDuration()
        deckProgressRef.current = { ...deckProgressRef.current, [deck]: 0 }
        deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: totalDuration }
        deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: false }
        prebufferedDeckRef.current = { ...prebufferedDeckRef.current, [deck]: pendingVideoId }
        clearDeckPrebuffer(deck)
        setDeckProgress((prev) => ({ ...prev, [deck]: 0 }))
        setDeckDurations((prev) => ({ ...prev, [deck]: totalDuration }))
        setDeckPlaying((prev) => ({ ...prev, [deck]: false }))
      } catch {
        // Ignore timing errors while warming the hidden deck.
      }
    },
    [clearDeckPrebuffer, getDeckPlayer]
  )

  const prebufferDeck = useCallback(
    (deck: DeckId, track: Track) => {
      const player = getDeckPlayer(deck)
      if (!player) return
      if (prebufferingDeckRef.current[deck] === track.videoId || prebufferedDeckRef.current[deck] === track.videoId) {
        return
      }

      clearDeckPrebuffer(deck)
      prebufferedDeckRef.current = { ...prebufferedDeckRef.current, [deck]: null }
      prebufferingDeckRef.current = { ...prebufferingDeckRef.current, [deck]: track.videoId }

      player.mute()
      player.loadVideoById(track.videoId)

      PREBUFFER_FINALIZE_DELAYS_MS.forEach((delay) => {
        const timeout = setTimeout(() => {
          finalizeDeckPrebuffer(deck, track.videoId)
        }, delay)
        prebufferTimeoutsRef.current[deck].push(timeout)
      })
    },
    [clearDeckPrebuffer, finalizeDeckPrebuffer, getDeckPlayer]
  )

  const requestDeckPlayback = useCallback(
    (deck: DeckId, options: { mutedStart?: boolean } = {}) => {
      const player = getDeckPlayer(deck)
      if (!player) return

      clearDeckPrebuffer(deck)
      prebufferedDeckRef.current = { ...prebufferedDeckRef.current, [deck]: null }
      clearPlayRetries()
      if (options.mutedStart) {
        player.mute()
      } else {
        player.unMute()
        player.setVolume(masterVolumeRef.current)
        deckVolumeRef.current[deck] = masterVolumeRef.current
      }
      player.playVideo()

      PLAY_RETRY_DELAYS_MS.forEach((delay) => {
        const timeout = setTimeout(() => {
          const retryPlayer = getDeckPlayer(deck)
          if (!retryPlayer) return

          const playerState = retryPlayer.getPlayerState()
          if (playerState !== window.YT.PlayerState.PLAYING) {
            retryPlayer.playVideo()
          }
        }, delay)

        playRetryTimeouts.current.push(timeout)
      })

      if (options.mutedStart) {
        MUTED_PLAY_RETRY_DELAYS_MS.forEach((delay) => {
          const timeout = setTimeout(() => {
            const retryPlayer = getDeckPlayer(deck)
            if (!retryPlayer) return

            retryPlayer.unMute()
            retryPlayer.setVolume(masterVolumeRef.current)
            deckVolumeRef.current[deck] = masterVolumeRef.current
            if (retryPlayer.getPlayerState() !== window.YT.PlayerState.PLAYING) {
              retryPlayer.playVideo()
            }
          }, delay)

          playRetryTimeouts.current.push(timeout)
        })
      }
    },
    [clearDeckPrebuffer, clearPlayRetries, getDeckPlayer]
  )

  const addTrackToHistory = useCallback((track: Track) => {
    setHistory((prev) => addPlayedTrackToHistory(prev, track))
  }, [])

  // Pulsing effect for next track
  useEffect(() => {
    if (!autoplay || queue.length === 0 || !duration || !isPlaying || visualTransitionTriggered.current) {
      setIsPulsing(false)
      return
    }

    const timeRemaining = duration - progress
    const pulseLeadSeconds =
      overlap === "none" ? NO_OVERLAP_PULSE_LEAD_SECONDS : overlapSeconds + OVERLAP_PULSE_EXTRA_SECONDS
    if (timeRemaining <= pulseLeadSeconds && timeRemaining > 0) {
      setIsPulsing(true)
    } else {
      setIsPulsing(false)
    }
  }, [autoplay, queue.length, duration, progress, isPlaying, overlap, overlapSeconds])

  const startDeckTrack = useCallback(
    (
      deck: DeckId,
      track: Track,
      shouldPlay: boolean,
      options: { mutedStart?: boolean; addToHistory?: boolean } = {}
    ) => {
      const player = getDeckPlayer(deck)
      if (player) {
        setDeckTracks((prev) => ({ ...prev, [deck]: track }))
        resetDeckPlaybackState(deck)
        setIsSpinningDown(false)
        setDeckVolume(deck, masterVolumeRef.current)
        if (deck === activeDeckRef.current) {
          setCurrentTrack(track)
          setProgress(0)
          setDuration(0)
          setIsPlaying(false)
        }
        clearDeckPrebuffer(deck)
        prebufferedDeckRef.current = { ...prebufferedDeckRef.current, [deck]: null }

        if (shouldPlay) {
          if (options.addToHistory !== false) {
            addTrackToHistory(track)
          }
          player.loadVideoById(track.videoId)
          requestDeckPlayback(deck, options)
        } else {
          clearPlayRetries()
          player.cueVideoById(track.videoId)
        }
        transitionTriggered.current = false
        visualTransitionTriggered.current = false
        transitionCompleteTriggered.current = false
        pendingTransitionDeckRef.current = null
        pendingTransitionTrackRef.current = null
        return true
      }

      return false
    },
    [
      addTrackToHistory,
      clearDeckPrebuffer,
      clearPlayRetries,
      getDeckPlayer,
      requestDeckPlayback,
      resetDeckPlaybackState,
      setDeckVolume,
    ]
  )

  const prepareIncomingDeck = useCallback(
    (track: Track) => {
      const incomingDeck = getOtherDeck(activeDeckRef.current)
      const player = getDeckPlayer(incomingDeck)
      if (!player) return incomingDeck

      pendingTransitionDeckRef.current = incomingDeck
      pendingTransitionTrackRef.current = track
      if (deckTracksRef.current[incomingDeck]?.videoId !== track.videoId) {
        setDeckTracks((prev) => ({ ...prev, [incomingDeck]: track }))
        resetDeckPlaybackState(incomingDeck)
        setDeckVolume(incomingDeck, masterVolumeRef.current)
        prebufferedDeckRef.current = { ...prebufferedDeckRef.current, [incomingDeck]: null }
        prebufferDeck(incomingDeck, track)
      } else if (
        prebufferingDeckRef.current[incomingDeck] !== track.videoId &&
        prebufferedDeckRef.current[incomingDeck] !== track.videoId
      ) {
        prebufferDeck(incomingDeck, track)
      }

      return incomingDeck
    },
    [getDeckPlayer, getOtherDeck, prebufferDeck, resetDeckPlaybackState, setDeckVolume]
  )

  const playTrack = useCallback(
    (track: Track, options: { mutedStart?: boolean; addToHistory?: boolean } = {}) => {
      if (playerReady) {
        startDeckTrack(activeDeckRef.current, track, true, options)
      }
    },
    [playerReady, startDeckTrack]
  )

  const loadTrack = useCallback(
    (track: Track) => {
      if (playerReady) {
        startDeckTrack(activeDeckRef.current, track, false)
      }
    },
    [playerReady, startDeckTrack]
  )

  const firstQueuedTrack = queue[0]
  const currentTrackId = currentTrack?.id ?? null
  const firstQueuedTrackId = firstQueuedTrack?.id ?? null

  useEffect(() => {
    if (
      !hasLoadedStoredPlaylist ||
      !hasLoadedStoredSettings ||
      hasAutoLoadedStoredTrack.current ||
      !autoplay ||
      !playerReady ||
      currentTrackId ||
      !firstQueuedTrack
    ) {
      return
    }

    hasAutoLoadedStoredTrack.current = true
    setQueue((prev) => prev.slice(1))
    playTrack(firstQueuedTrack, { mutedStart: true })
  }, [
    hasLoadedStoredPlaylist,
    hasLoadedStoredSettings,
    autoplay,
    playerReady,
    currentTrackId,
    firstQueuedTrackId,
    firstQueuedTrack,
    playTrack,
  ])

  const resetOverlapTransition = useCallback(() => {
    setIsTransitioning(false)
    setIsTransitionSettling(false)
    setPrimaryWidth(FULL_PLAYER_WIDTH)
    setIncomingPanelWidth(HIDDEN_PLAYER_WIDTH)
    DECK_IDS.forEach(clearDeckPrebuffer)
    prebufferedDeckRef.current = createDeckMap<string | null>(null)
    setActiveDeckVolume(masterVolumeRef.current)
    transitionTriggered.current = false
    visualTransitionTriggered.current = false
    transitionCompleteTriggered.current = false
    pendingTransitionDeckRef.current = null
    pendingTransitionTrackRef.current = null
  }, [clearDeckPrebuffer, setActiveDeckVolume])

  const handleAutoplayToggle = useCallback(() => {
    setAutoplay((currentAutoplay) => {
      if (currentAutoplay) {
        setOverlap("none")
        resetOverlapTransition()
      }
      return !currentAutoplay
    })
  }, [resetOverlapTransition])

  const handleTrackEnded = useCallback(() => {
    setAutoplay((currentAutoplay) => {
      if (currentAutoplay && queueRef.current.length > 0 && overlapRef.current === "none") {
        const nextTrack = queueRef.current[0]
        if (!nextTrack) return currentAutoplay

        setQueue((prev) => prev.slice(1))
        setTimeout(() => {
          startDeckTrack(activeDeckRef.current, nextTrack, true)
        }, TRACK_END_PLAY_DELAY_MS)
      }
      return currentAutoplay
    })
  }, [startDeckTrack])

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded
  }, [handleTrackEnded])

  const completeOverlapTransition = useCallback(
    (outgoingDeck: DeckId) => {
      const incomingDeck = pendingTransitionDeckRef.current ?? getOtherDeck(outgoingDeck)
      const incomingTrack = deckTracksRef.current[incomingDeck]
      if (!incomingTrack || transitionCompleteTriggered.current) return

      transitionCompleteTriggered.current = true
      setPrimaryWidth(HIDDEN_PLAYER_WIDTH)
      setIncomingPanelWidth(FULL_PLAYER_WIDTH)

      setTimeout(() => {
        const incomingPlayer = getDeckPlayer(incomingDeck)
        let nextProgress = deckProgressRef.current[incomingDeck]
        let nextDuration = deckDurationsRef.current[incomingDeck]

        try {
          if (incomingPlayer?.getVideoData().video_id === incomingTrack.videoId) {
            nextProgress = incomingPlayer.getCurrentTime()
            nextDuration = incomingPlayer.getDuration()
          }
        } catch {
          // Keep the last sampled deck values if YouTube rejects a read during handoff.
        }

        deckProgressRef.current = { ...deckProgressRef.current, [incomingDeck]: nextProgress }
        deckDurationsRef.current = { ...deckDurationsRef.current, [incomingDeck]: nextDuration }

        activeDeckRef.current = incomingDeck
        setActiveDeck(incomingDeck)
        currentTrackRef.current = incomingTrack
        setCurrentTrack(incomingTrack)
        setProgress(nextProgress)
        setDuration(nextDuration)
        setIsPlaying(deckPlayingRef.current[incomingDeck])
        setDeckProgress((prev) => ({ ...prev, [incomingDeck]: nextProgress }))
        setDeckDurations((prev) => ({ ...prev, [incomingDeck]: nextDuration }))

        const outgoingPlayer = getDeckPlayer(outgoingDeck)
        try {
          outgoingPlayer?.stopVideo()
        } catch {
          // Ignore YouTube API timing errors during deck cleanup.
        }

        setDeckTracks((prev) => ({ ...prev, [outgoingDeck]: null }))
        resetDeckPlaybackState(outgoingDeck)
        clearDeckPrebuffer(outgoingDeck)
        prebufferedDeckRef.current = { ...prebufferedDeckRef.current, [outgoingDeck]: null }
        setDeckVolume(incomingDeck, masterVolumeRef.current)
        setIsSpinningDown(false)

        setIsTransitionSettling(true)
        setIsTransitioning(false)
        setPrimaryWidth(FULL_PLAYER_WIDTH)

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              setIsTransitionSettling(false)
              setIncomingPanelWidth(HIDDEN_PLAYER_WIDTH)
              transitionTriggered.current = false
              visualTransitionTriggered.current = false
              transitionCompleteTriggered.current = false
              pendingTransitionDeckRef.current = null
              pendingTransitionTrackRef.current = null
            }, PLAYER_SETTLE_DELAY_MS)
          })
        })
      }, PLAYER_PANEL_TRANSITION_MS)
    },
    [clearDeckPrebuffer, getDeckPlayer, getOtherDeck, resetDeckPlaybackState, setDeckVolume]
  )

  useEffect(() => {
    handleDeckEndedRef.current = (deck) => {
      setDeckPlaying((prev) => ({ ...prev, [deck]: false }))

      if (deck !== activeDeckRef.current) {
        return
      }

      if (transitionTriggered.current && overlapRef.current !== "none") {
        completeOverlapTransition(deck)
        return
      }

      setIsPlaying(false)
      if (queueRef.current.length === 0) {
        setIsSpinningDown(true)
      }
      handleTrackEndedRef.current?.()
    }
  }, [completeOverlapTransition])

  useEffect(() => {
    setPlayerReady(deckReady.a && deckReady.b)
  }, [deckReady])

  // Initialize the two permanent YouTube decks.
  useEffect(() => {
    const createDeckPlayer = (deck: DeckId) => {
      playerRefs.current[deck] = new window.YT.Player(`youtube-player-${deck}`, {
        height: "1",
        width: "1",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          origin: window.location.origin,
          rel: 0,
        },
        events: {
          onReady: () => {
            setDeckReady((prev) => ({ ...prev, [deck]: true }))
            playerRefs.current[deck]?.setVolume(masterVolumeRef.current)
          },
          onStateChange: (event) => {
            if (prebufferingDeckRef.current[deck]) {
              if (event.data === window.YT.PlayerState.PLAYING || event.data === window.YT.PlayerState.BUFFERING) {
                const expectedVideoId = prebufferingDeckRef.current[deck]
                const timeout = setTimeout(() => {
                  finalizeDeckPrebuffer(deck, expectedVideoId ?? undefined)
                }, PREBUFFER_STATE_SETTLE_MS)
                prebufferTimeoutsRef.current[deck].push(timeout)
              }
              return
            }

            if (event.data === window.YT.PlayerState.PLAYING) {
              deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: true }
              setDeckPlaying((prev) => ({ ...prev, [deck]: true }))
              if (pendingTransitionDeckRef.current === deck && deck !== activeDeckRef.current) {
                crossfadeBackgroundTo(deckTracksRef.current[deck]?.thumbnail ?? null)
              }
              if (deck === activeDeckRef.current) {
                setIsSpinningDown(false)
                setIsPlaying(true)
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: false }
              setDeckPlaying((prev) => ({ ...prev, [deck]: false }))
              if (deck === activeDeckRef.current) {
                setIsSpinningDown(false)
                setIsPlaying(false)
              }
            } else if (event.data === window.YT.PlayerState.ENDED) {
              deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: false }
              handleDeckEndedRef.current?.(deck)
            }
          },
        },
      })
    }

    const createMetadataPlayer = () => {
      metadataPlayerRef.current = new window.YT.Player("youtube-player-metadata", {
        height: "1",
        width: "1",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          origin: window.location.origin,
          rel: 0,
        },
        events: {
          onReady: () => {
            metadataPlayerRef.current?.mute()
            processNextMetadataTrack()
          },
          onStateChange: (event) => {
            const pendingVideoId = pendingMetadataVideoIdRef.current
            if (!pendingVideoId) return

            if (event.data !== window.YT.PlayerState.CUED && event.data !== window.YT.PlayerState.PLAYING) {
              return
            }

            const finalizeMetadataRead = () => {
              const metadataPlayer = metadataPlayerRef.current
              if (!metadataPlayer || pendingMetadataVideoIdRef.current !== pendingVideoId) return

              const retryMetadataRead = () => {
                metadataRetryCountRef.current += 1
                if (metadataRetryCountRef.current >= METADATA_DURATION_MAX_RETRIES) {
                  pendingMetadataVideoIdRef.current = null
                  processNextMetadataTrack()
                  return
                }

                metadataRetryTimeoutRef.current = setTimeout(finalizeMetadataRead, METADATA_DURATION_RETRY_DELAY_MS)
              }

              try {
                if (metadataPlayer.getVideoData().video_id !== pendingVideoId) {
                  retryMetadataRead()
                  return
                }

                const durationSeconds = metadataPlayer.getDuration()
                if (!durationSeconds || durationSeconds <= 0) {
                  retryMetadataRead()
                  return
                }

                applyDurationMetadata(pendingVideoId, durationSeconds)
                pendingMetadataVideoIdRef.current = null
                processNextMetadataTrack()
              } catch {
                retryMetadataRead()
              }
            }

            if (metadataRetryTimeoutRef.current) {
              clearTimeout(metadataRetryTimeoutRef.current)
            }
            metadataRetryTimeoutRef.current = setTimeout(finalizeMetadataRead, 250)
          },
        },
      })
    }

    const initializeDecks = () => {
      if (apiReadyRef.current) return
      apiReadyRef.current = true
      createDeckPlayer("a")
      createDeckPlayer("b")
      createMetadataPlayer()
    }

    if (window.YT?.Player) {
      initializeDecks()
    } else {
      window.onYouTubeIframeAPIReady = initializeDecks
      if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        if (firstScriptTag?.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        } else {
          document.head.appendChild(tag)
        }
      }
    }

    const players = playerRefs.current

    return () => {
      clearPlayRetries()
      DECK_IDS.forEach(clearDeckPrebuffer)
      if (progressInterval.current) clearInterval(progressInterval.current)
      if (metadataRetryTimeoutRef.current) clearTimeout(metadataRetryTimeoutRef.current)
      DECK_IDS.forEach((deck) => {
        try {
          players[deck]?.destroy()
        } catch {
          // Ignore cleanup errors.
        }
        players[deck] = null
      })
      try {
        metadataPlayerRef.current?.destroy()
      } catch {
        // Ignore cleanup errors.
      }
      metadataPlayerRef.current = null
    }
  }, [
    applyDurationMetadata,
    clearDeckPrebuffer,
    clearPlayRetries,
    crossfadeBackgroundTo,
    finalizeDeckPrebuffer,
    processNextMetadataTrack,
  ])

  useEffect(() => {
    if (!playerReady || !pendingInitialTrackRef.current) return

    const { track, shouldPlay } = pendingInitialTrackRef.current
    pendingInitialTrackRef.current = null
    startDeckTrack(activeDeckRef.current, track, shouldPlay)
  }, [playerReady, startDeckTrack])

  // Fade out the outgoing deck before overlap starts.
  useEffect(() => {
    const nextTrack = pendingTransitionTrackRef.current ?? queue[0]
    if (overlap === "none" || !autoplay || !nextTrack || !duration || !isPlaying) {
      setActiveDeckVolume(masterVolume)
      return
    }

    const fadeWindowSeconds = overlapSeconds * OUTGOING_FADE_WINDOW_MULTIPLIER
    if (!fadeWindowSeconds) {
      setActiveDeckVolume(masterVolume)
      return
    }

    const timeRemaining = duration - progress
    if (timeRemaining <= fadeWindowSeconds && timeRemaining > 0) {
      setActiveDeckVolume((timeRemaining / fadeWindowSeconds) * masterVolume)
      if (timeRemaining > overlapSeconds) {
        prepareIncomingDeck(nextTrack)
      }
    } else {
      setActiveDeckVolume(masterVolume)
    }
  }, [
    progress,
    duration,
    overlap,
    autoplay,
    queue,
    overlapSeconds,
    masterVolume,
    isPlaying,
    setActiveDeckVolume,
    prepareIncomingDeck,
  ])

  // Bring the incoming track into view before audio overlap starts.
  useEffect(() => {
    const nextTrack = queue[0]
    if (overlap === "none" || !autoplay || !nextTrack || !duration || !isPlaying) {
      return
    }

    const timeRemaining = duration - progress
    const visualLeadSeconds = overlapSeconds + VISUAL_TRANSITION_LEAD_SECONDS
    if (timeRemaining <= visualLeadSeconds && timeRemaining > overlapSeconds && !visualTransitionTriggered.current) {
      visualTransitionTriggered.current = true
      prepareIncomingDeck(nextTrack)
      showIncomingTransition()
      setQueue((prev) => (prev[0]?.id === nextTrack.id ? prev.slice(1) : prev))
    }
  }, [
    progress,
    duration,
    overlap,
    autoplay,
    queue,
    overlapSeconds,
    prepareIncomingDeck,
    isPlaying,
    showIncomingTransition,
  ])

  // Start overlap audio at the configured overlap point.
  useEffect(() => {
    const nextTrack = pendingTransitionTrackRef.current ?? queue[0]
    if (overlap === "none" || !autoplay || !nextTrack || !duration || !isPlaying) {
      return
    }

    const timeRemaining = duration - progress
    if (timeRemaining <= overlapSeconds && timeRemaining > 0 && !transitionTriggered.current) {
      transitionTriggered.current = true

      // Ensure transition is visible even if the visual lead window was skipped.
      visualTransitionTriggered.current = true
      const incomingDeck = prepareIncomingDeck(nextTrack)
      showIncomingTransition()
      setQueue((prev) => (prev[0]?.id === nextTrack.id ? prev.slice(1) : prev))
      addTrackToHistory(nextTrack)
      requestDeckPlayback(incomingDeck)
    }
  }, [
    progress,
    duration,
    overlap,
    autoplay,
    queue,
    overlapSeconds,
    prepareIncomingDeck,
    isPlaying,
    addTrackToHistory,
    requestDeckPlayback,
    showIncomingTransition,
  ])

  // Update progress for both permanent decks.
  useEffect(() => {
    progressInterval.current = setInterval(() => {
      DECK_IDS.forEach((deck) => {
        const player = getDeckPlayer(deck)
        const track = deckTracksRef.current[deck]
        if (!player || !track) return

        try {
          const loadedVideoId = player.getVideoData().video_id
          if (loadedVideoId !== track.videoId) {
            deckProgressRef.current = { ...deckProgressRef.current, [deck]: 0 }
            deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: 0 }
            setDeckProgress((prev) => ({ ...prev, [deck]: 0 }))
            setDeckDurations((prev) => (prev[deck] === 0 ? prev : { ...prev, [deck]: 0 }))

            if (deck === activeDeckRef.current) {
              setProgress(0)
              setDuration(0)
            }

            return
          }

          if (prebufferingDeckRef.current[deck] === track.videoId) {
            const totalDuration = player.getDuration()
            if (shouldApplyTrackDurationMetadata(track, totalDuration)) {
              applyDurationMetadata(track.videoId, totalDuration)
            }
            deckProgressRef.current = { ...deckProgressRef.current, [deck]: 0 }
            deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: totalDuration }
            setDeckProgress((prev) => ({ ...prev, [deck]: 0 }))
            setDeckDurations((prev) => (prev[deck] === totalDuration ? prev : { ...prev, [deck]: totalDuration }))
            return
          }

          const currentTime = player.getCurrentTime()
          const totalDuration = player.getDuration()
          if (shouldApplyTrackDurationMetadata(track, totalDuration)) {
            applyDurationMetadata(track.videoId, totalDuration)
          }
          deckProgressRef.current = { ...deckProgressRef.current, [deck]: currentTime }
          deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: totalDuration }
          setDeckProgress((prev) => ({ ...prev, [deck]: currentTime }))
          setDeckDurations((prev) => (prev[deck] === totalDuration ? prev : { ...prev, [deck]: totalDuration }))

          if (deck === activeDeckRef.current) {
            setProgress(currentTime)
            setDuration(totalDuration)
          }
        } catch {
          // Player can briefly reject reads while a video is being cued.
        }
      })
    }, PROGRESS_POLL_MS)

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [applyDurationMetadata, getDeckPlayer])

  const handleAddTrack = useCallback(() => {
    const videoId = extractVideoId(urlInput.trim())
    if (!videoId) {
      const errorMessage = "Please enter a valid YouTube URL"
      setUrlError(errorMessage)
      toast.error(errorMessage)
      return
    }

    setUrlError("")
    const track: Track = {
      id: `${videoId}-${Date.now()}`,
      videoId,
      title: `Video ${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      addedAt: Date.now(),
    }

    const addTrackToPlayer = (track: Track) => {
      const platterIsEmpty = !currentTrackRef.current

      if (platterIsEmpty) {
        if (playerReady) {
          if (autoplay) {
            playTrack(track)
          } else {
            loadTrack(track)
          }
        } else {
          setCurrentTrack(track)
          setIsPlaying(false)
          setProgress(0)
          setDuration(0)
          pendingInitialTrackRef.current = { track, shouldPlay: autoplay }
        }
      } else {
        setQueue((prev) => [...prev, track])
      }
    }

    addTrackToPlayer(track)
    queueDurationMetadataLookup(track)
    setUrlInput("")

    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.title !== "string" || !data.title) {
          showSingleSuccessToast("Added track")
          return
        }

        const applyTitle = (savedTrack: Track) =>
          savedTrack.id === track.id ? { ...savedTrack, title: data.title } : savedTrack

        setCurrentTrack((current) => (current ? applyTitle(current) : current))
        setDeckTracks((prev) => {
          const nextDeckTracks = {
            a: prev.a ? applyTitle(prev.a) : prev.a,
            b: prev.b ? applyTitle(prev.b) : prev.b,
          }
          deckTracksRef.current = nextDeckTracks
          return nextDeckTracks
        })
        setQueue((prev) => prev.map(applyTitle))
        setHistory((prev) => sortHistoryByPlayedTime(prev.map(applyTitle)))

        if (pendingInitialTrackRef.current?.track.id === track.id) {
          pendingInitialTrackRef.current = {
            ...pendingInitialTrackRef.current,
            track: { ...pendingInitialTrackRef.current.track, title: data.title },
          }
        }

        showSingleSuccessToast(`Added "${data.title}"`)
      })
      .catch(() => {
        showSingleSuccessToast("Added track")
        // Keep the fallback title if metadata lookup fails.
      })
  }, [urlInput, playerReady, autoplay, playTrack, loadTrack, queueDurationMetadataLookup, showSingleSuccessToast])

  const handlePlayPause = useCallback(() => {
    const player = getDeckPlayer(activeDeckRef.current)
    if (!player) return

    if (isPlaying) {
      clearPlayRetries()
      player.pauseVideo()
    } else {
      requestDeckPlayback(activeDeckRef.current)
    }
  }, [clearPlayRetries, getDeckPlayer, isPlaying, requestDeckPlayback])

  const handleActivePause = useCallback(() => {
    const player = getDeckPlayer(activeDeckRef.current)
    if (!player) return

    clearPlayRetries()
    player.pauseVideo()
  }, [clearPlayRetries, getDeckPlayer])

  const handleActiveResume = useCallback(() => {
    if (!currentTrackRef.current) return

    requestDeckPlayback(activeDeckRef.current)
  }, [requestDeckPlayback])

  const handleSeek = useCallback(
    (percentage: number) => {
      const deck = activeDeckRef.current
      const player = getDeckPlayer(deck)
      if (!player || !duration) return

      const seekTime = percentage * duration
      player.seekTo(seekTime, true)
      deckProgressRef.current = { ...deckProgressRef.current, [deck]: seekTime }
      setDeckProgress((prev) => ({ ...prev, [deck]: seekTime }))
      setProgress(seekTime)
    },
    [duration, getDeckPlayer]
  )

  const showSeekNudgeFeedback = useCallback((label: string) => {
    if (seekNudgeTimeoutRef.current) {
      clearTimeout(seekNudgeTimeoutRef.current)
    }

    seekNudgeIdRef.current += 1
    setSeekNudgeFeedback({ id: seekNudgeIdRef.current, label })
    seekNudgeTimeoutRef.current = setTimeout(() => {
      setSeekNudgeFeedback(null)
      seekNudgeTimeoutRef.current = null
    }, 700)
  }, [])

  const handleKeyboardSeek = useCallback(
    (seconds: number) => {
      const deck = activeDeckRef.current
      const player = getDeckPlayer(deck)
      const deckDuration = deckDurationsRef.current[deck] || duration
      if (!player || !deckDuration) return

      let currentTime = deckProgressRef.current[deck] || progress
      try {
        currentTime = player.getCurrentTime()
      } catch {
        // Keep the last sampled progress if YouTube rejects a read.
      }

      const seekTime = Math.min(deckDuration, Math.max(0, currentTime + seconds))
      player.seekTo(seekTime, true)
      deckProgressRef.current = { ...deckProgressRef.current, [deck]: seekTime }
      setDeckProgress((prev) => ({ ...prev, [deck]: seekTime }))
      setProgress(seekTime)
      showSeekNudgeFeedback(seconds > 0 ? `+${Math.abs(seconds)}s` : `-${Math.abs(seconds)}s`)
    },
    [duration, getDeckPlayer, progress, showSeekNudgeFeedback]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        handleKeyboardSeek(-KEYBOARD_SEEK_STEP_SECONDS)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        handleKeyboardSeek(KEYBOARD_SEEK_STEP_SECONDS)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyboardSeek])

  useEffect(() => {
    return () => {
      if (seekNudgeTimeoutRef.current) {
        clearTimeout(seekNudgeTimeoutRef.current)
      }
    }
  }, [])

  const handleSecondarySeek = useCallback(
    (percentage: number) => {
      const deck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeckRef.current)
      const player = getDeckPlayer(deck)
      const deckDuration = deckDurations[deck]
      if (!player || !deckDuration) return

      const seekTime = percentage * deckDuration
      player.seekTo(seekTime, true)
      deckProgressRef.current = { ...deckProgressRef.current, [deck]: seekTime }
      setDeckProgress((prev) => ({ ...prev, [deck]: seekTime }))
    },
    [deckDurations, getDeckPlayer, getOtherDeck]
  )

  const handleSecondaryPlayPause = useCallback(() => {
    const deck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeckRef.current)
    const player = getDeckPlayer(deck)
    if (!player) return

    if (deckPlaying[deck]) {
      player.pauseVideo()
    } else {
      requestDeckPlayback(deck)
    }
  }, [deckPlaying, getDeckPlayer, getOtherDeck, requestDeckPlayback])

  const handleSecondaryPause = useCallback(() => {
    const deck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeckRef.current)
    const player = getDeckPlayer(deck)
    if (!player) return

    clearPlayRetries()
    player.pauseVideo()
  }, [clearPlayRetries, getDeckPlayer, getOtherDeck])

  const handleSecondaryResume = useCallback(() => {
    const deck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeckRef.current)
    if (!deckTracksRef.current[deck]) return

    requestDeckPlayback(deck)
  }, [getOtherDeck, requestDeckPlayback])

  const handleDragEnd = useCallback((event: DragEndEvent, orderedTracks?: Track[]) => {
    if (orderedTracks) {
      setQueue((items) => {
        if (orderedTracks.length === items.length) {
          return orderedTracks
        }

        const orderedTrackIds = new Set(orderedTracks.map((track) => track.id))
        let orderedIndex = 0

        return items.map((item) => {
          if (!orderedTrackIds.has(item.id)) return item

          const orderedTrack = orderedTracks[orderedIndex]
          orderedIndex += 1
          return orderedTrack ?? item
        })
      })
      return
    }

    const { active, over } = event
    if (over && active.id !== over.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return items

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleMoveToTop = useCallback((id: string) => {
    setQueue((items) => {
      const index = items.findIndex((item) => item.id === id)
      if (index > 0) {
        return arrayMove(items, index, 0)
      }
      return items
    })
  }, [])

  const handleMoveUp = useCallback((id: string) => {
    setQueue((items) => {
      const index = items.findIndex((item) => item.id === id)
      if (index > 0) {
        return arrayMove(items, index, index - 1)
      }
      return items
    })
  }, [])

  const handleMoveDown = useCallback((id: string) => {
    setQueue((items) => {
      const index = items.findIndex((item) => item.id === id)
      if (index < items.length - 1) {
        return arrayMove(items, index, index + 1)
      }
      return items
    })
  }, [])

  const handleRemove = useCallback((id: string) => {
    setQueue((items) => items.filter((item) => item.id !== id))
  }, [])

  const handleRemoveFromHistory = useCallback((id: string) => {
    setHistory((items) => items.filter((item) => item.id !== id))
  }, [])

  const handleEraseMemory = useCallback(() => {
    window.localStorage.removeItem(PLAYLIST_STORAGE_KEY)
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
    window.localStorage.removeItem(PLAYER_TITLE_STORAGE_KEY)
    setQueue([])
    setHistory([])
    setAutoplay(true)
    setOverlap(DEFAULT_OVERLAP)
    setPlayerTitle(DEFAULT_PLAYER_TITLE)
    resetOverlapTransition()
    showSingleSuccessToast("History and queue cleared")
  }, [resetOverlapTransition, setPlayerTitle, showSingleSuccessToast])

  const handleCopyTrack = useCallback((track: Track) => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${track.videoId}`)
  }, [])

  const handleRequeue = useCallback(
    (track: Track) => {
      const newTrack = { ...track, id: `${track.videoId}-${Date.now()}`, addedAt: Date.now() }
      setQueue((prev) => [...prev, newTrack])
      showSingleSuccessToast(`Added "${track.title}" to the playlist`)
    },
    [showSingleSuccessToast]
  )

  const handlePlayFromQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => prev.filter((t) => t.id !== track.id))
      playTrack(track)
    },
    [playTrack]
  )

  const handleSkipNext = useCallback(() => {
    const nextTrack = queue[0]
    if (!nextTrack) return

    setQueue((prev) => prev.slice(1))
    playTrack(nextTrack)
  }, [queue, playTrack])

  const handleSkipBack = useCallback(() => {
    const prevTrack = history[0]
    if (!prevTrack) return

    if (currentTrack) {
      setQueue((prev) => [currentTrack, ...prev])
    }
    setHistory((prev) => prev.slice(1))
    playTrack(prevTrack, { addToHistory: false })
  }, [history, currentTrack, playTrack])

  const incomingDeck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeck)
  const incomingTrack = deckTracks[incomingDeck]
  const incomingProgress = deckProgress[incomingDeck]
  const incomingDuration = deckDurations[incomingDeck]
  const incomingPlaying = deckPlaying[incomingDeck]
  const queueDurationLabel = formatTotalDuration(
    queue.reduce((totalDuration, track) => totalDuration + (track.durationSeconds ?? 0), 0)
  )
  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <div className="parrot-line-field" aria-hidden="true">
        {Array.from({ length: 11 }, (_, index) => (
          <div key={index} className="parrot-line" />
        ))}
      </div>

      {/* Hidden YouTube Players */}
      <div className="hidden" id="player-container">
        <div id="youtube-player-a" />
        <div id="youtube-player-b" />
        <div id="youtube-player-metadata" />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <Tooltip
        id="player-tooltip"
        className="player-tooltip"
        opacity={1}
        portalRoot={tooltipRoot}
        positionStrategy="fixed"
      />
      <ToastContainer
        position="top-center"
        autoClose={1000}
        hideProgressBar
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="dark"
        transition={Slide}
      />

      {/* Main player container */}
      <div className="relative z-10 flex h-screen min-h-0 max-w-2xl mx-auto flex-col bg-card shadow-2xl overflow-hidden border-x border-border">
        <PlayerHeader
          playerTitle={playerTitle}
          autoplay={autoplay}
          overlap={overlap}
          onPlayerTitleChange={setPlayerTitle}
          onAutoplayToggle={handleAutoplayToggle}
          onOverlapChange={setOverlap}
          onHelpOpen={() => setShowHelp(true)}
        />

        <PlayerStage
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isSpinningDown={isSpinningDown}
          progress={progress}
          duration={duration}
          onPlayPause={handlePlayPause}
          onPause={handleActivePause}
          onResume={handleActiveResume}
          onSeek={handleSeek}
          seekNudgeFeedback={seekNudgeFeedback}
          masterVolume={masterVolume}
          onMasterVolumeChange={handleMasterVolumeChange}
          onSkipNext={handleSkipNext}
          onSkipBack={handleSkipBack}
          showBackButton={history.length > 0}
          isTransitioning={isTransitioning}
          isTransitionSettling={isTransitionSettling}
          primaryWidth={primaryWidth}
          incomingPanelWidth={incomingPanelWidth}
          incomingTrack={incomingTrack}
          incomingProgress={incomingProgress}
          incomingDuration={incomingDuration}
          incomingPlaying={incomingPlaying}
          onSecondaryPlayPause={handleSecondaryPlayPause}
          onSecondaryPause={handleSecondaryPause}
          onSecondaryResume={handleSecondaryResume}
          onSecondarySeek={handleSecondarySeek}
          backgroundLayers={backgroundLayers}
          visibleBackgroundLayer={visibleBackgroundLayer}
          fadingBackgroundLayer={fadingBackgroundLayer}
        />

        <AddTrackForm
          urlInput={urlInput}
          urlError={urlError}
          onUrlInputChange={(value) => {
            setUrlInput(value)
            setUrlError("")
          }}
          onAddTrack={handleAddTrack}
        />

        <TrackTabs
          activeTab={activeTab}
          queueCount={queue.length}
          queueDurationLabel={queueDurationLabel}
          historyCount={history.length}
          onActiveTabChange={setActiveTab}
          onEraseMemory={handleEraseMemory}
        />

        <TrackList
          activeTab={activeTab}
          queue={queue}
          history={history}
          isPulsing={isPulsing}
          onDragEnd={handleDragEnd}
          onRemove={handleRemove}
          onMoveToTop={handleMoveToTop}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onPlayFromQueue={handlePlayFromQueue}
          onCopyTrack={handleCopyTrack}
          onRequeue={handleRequeue}
          onRemoveFromHistory={handleRemoveFromHistory}
        />
      </div>
    </div>
  )
}
