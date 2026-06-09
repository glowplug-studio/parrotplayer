"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { ToastContainer, toast } from "react-toastify"
import { Tooltip } from "react-tooltip"
import "react-toastify/dist/ReactToastify.css"
import "react-tooltip/dist/react-tooltip.css"

import { AddTrackForm } from "@/components/player/add-track-form"
import { HelpModal } from "@/components/player/help-modal"
import { PlayerHeader } from "@/components/player/player-header"
import { TrackList } from "@/components/player/track-list"
import { TrackTabs } from "@/components/player/track-tabs"
import { VinylPlayer } from "@/components/player/vinyl-player"
import { usePlayerSettingsStorage } from "@/hooks/player/use-player-settings-storage"
import { usePlaylistStorage } from "@/hooks/player/use-playlist-storage"
import { addPlayedTrackToHistory, sortHistoryByPlayedTime } from "@/lib/player/history"
import type { DeckId, DeckMap, OverlapSetting, Track, YouTubePlayer } from "@/lib/player/types"
import { extractVideoId, PLAYLIST_STORAGE_KEY, SETTINGS_STORAGE_KEY } from "@/lib/player/youtube"

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
  const [overlap, setOverlap] = useState<OverlapSetting>("none")
  const [isPulsing, setIsPulsing] = useState(false)
  const [isSpinningDown, setIsSpinningDown] = useState(false)
  const [tooltipRoot, setTooltipRoot] = useState<HTMLElement | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [previousBackgroundImage, setPreviousBackgroundImage] = useState<string | null>(null)
  const [isBackgroundFading, setIsBackgroundFading] = useState(false)
  const hasLoadedStoredSettings = usePlayerSettingsStorage({ autoplay, setAutoplay, overlap, setOverlap })
  const hasLoadedStoredPlaylist = usePlaylistStorage({ queue, setQueue, history, setHistory })

  const [activeDeck, setActiveDeck] = useState<DeckId>("a")
  const [deckTracks, setDeckTracks] = useState<DeckMap<Track | null>>({ a: null, b: null })
  const [deckProgress, setDeckProgress] = useState<DeckMap<number>>({ a: 0, b: 0 })
  const [deckDurations, setDeckDurations] = useState<DeckMap<number>>({ a: 0, b: 0 })
  const [deckPlaying, setDeckPlaying] = useState<DeckMap<boolean>>({ a: false, b: false })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [primaryWidth, setPrimaryWidth] = useState("100%")
  const [incomingPanelWidth, setIncomingPanelWidth] = useState("0%")
  const [deckReady, setDeckReady] = useState<DeckMap<boolean>>({ a: false, b: false })

  const playerRefs = useRef<DeckMap<YouTubePlayer | null>>({ a: null, b: null })
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const playRetryTimeouts = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef = useRef<Track[]>([])
  const overlapRef = useRef(overlap)
  const activeDeckRef = useRef<DeckId>("a")
  const deckTracksRef = useRef<DeckMap<Track | null>>({ a: null, b: null })
  const deckProgressRef = useRef<DeckMap<number>>({ a: 0, b: 0 })
  const deckDurationsRef = useRef<DeckMap<number>>({ a: 0, b: 0 })
  const deckPlayingRef = useRef<DeckMap<boolean>>({ a: false, b: false })
  const transitionTriggered = useRef(false)
  const visualTransitionTriggered = useRef(false)
  const transitionCompleteTriggered = useRef(false)
  const apiReadyRef = useRef(false)
  const deckVolumeRef = useRef<DeckMap<number>>({ a: 100, b: 100 })
  const pendingTransitionDeckRef = useRef<DeckId | null>(null)
  const pendingTransitionTrackRef = useRef<Track | null>(null)
  const handleTrackEndedRef = useRef<(() => void) | null>(null)
  const handleDeckEndedRef = useRef<((deck: DeckId) => void) | null>(null)
  const pendingInitialTrackRef = useRef<{ track: Track; shouldPlay: boolean } | null>(null)
  const hasAutoLoadedStoredTrack = useRef(false)
  const backgroundImageRef = useRef<string | null>(null)

  useEffect(() => {
    setTooltipRoot(document.body)
  }, [])

  // Keep refs in sync
  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    const nextBackgroundImage = currentTrack?.thumbnail ?? null
    if (nextBackgroundImage === backgroundImageRef.current) return

    setPreviousBackgroundImage(backgroundImageRef.current)
    backgroundImageRef.current = nextBackgroundImage
    setBackgroundImage(nextBackgroundImage)
    setIsBackgroundFading(false)

    const animationFrame = requestAnimationFrame(() => {
      setIsBackgroundFading(true)
    })

    const timeout = setTimeout(() => {
      setPreviousBackgroundImage(null)
    }, 700)

    return () => {
      cancelAnimationFrame(animationFrame)
      clearTimeout(timeout)
    }
  }, [currentTrack?.thumbnail])

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
    setPrimaryWidth("100%")
    setIncomingPanelWidth("0%")

    requestAnimationFrame(() => {
      setPrimaryWidth("50%")
      setIncomingPanelWidth("calc(50% - 0.5rem)")
    })
  }, [])

  const setDeckVolume = useCallback((deck: DeckId, volume: number) => {
    const nextVolume = Math.max(0, Math.min(100, Math.round(volume)))
    if (deckVolumeRef.current[deck] === nextVolume) return

    deckVolumeRef.current[deck] = nextVolume
    getDeckPlayer(deck)?.setVolume(nextVolume)
  }, [getDeckPlayer])

  const setActiveDeckVolume = useCallback((volume: number) => {
    setDeckVolume(activeDeckRef.current, volume)
  }, [setDeckVolume])

  const clearPlayRetries = useCallback(() => {
    playRetryTimeouts.current.forEach((timeout) => clearTimeout(timeout))
    playRetryTimeouts.current = []
  }, [])

  const requestDeckPlayback = useCallback((deck: DeckId, options: { mutedStart?: boolean } = {}) => {
    const player = getDeckPlayer(deck)
    if (!player) return

    clearPlayRetries()
    if (options.mutedStart) {
      player.mute()
    }
    player.playVideo()

    ;[250, 750, 1500, 3000, 5000].forEach((delay) => {
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
      ;[1000, 2500, 5000].forEach((delay) => {
        const timeout = setTimeout(() => {
          const retryPlayer = getDeckPlayer(deck)
          if (!retryPlayer) return

          retryPlayer.unMute()
          retryPlayer.setVolume(100)
          deckVolumeRef.current[deck] = 100
          if (retryPlayer.getPlayerState() !== window.YT.PlayerState.PLAYING) {
            retryPlayer.playVideo()
          }
        }, delay)

        playRetryTimeouts.current.push(timeout)
      })
    }
  }, [clearPlayRetries, getDeckPlayer])

  const addTrackToHistory = useCallback((track: Track) => {
    setHistory((prev) => addPlayedTrackToHistory(prev, track))
  }, [])

  const showSingleSuccessToast = useCallback((message: string) => {
    toast.dismiss()
    toast.success(message)
  }, [])

  // Pulsing effect for next track
  useEffect(() => {
    if (!autoplay || queue.length === 0 || !duration || !isPlaying || visualTransitionTriggered.current) {
      setIsPulsing(false)
      return
    }

    const timeRemaining = duration - progress
    const pulseLeadSeconds = overlap === "none" ? 8 : overlapSeconds + 10
    if (timeRemaining <= pulseLeadSeconds && timeRemaining > 0) {
      setIsPulsing(true)
    } else {
      setIsPulsing(false)
    }
  }, [autoplay, queue.length, duration, progress, isPlaying, overlap, overlapSeconds])

  const startDeckTrack = useCallback((deck: DeckId, track: Track, shouldPlay: boolean, options: { mutedStart?: boolean; addToHistory?: boolean } = {}) => {
    const player = getDeckPlayer(deck)
    if (player) {
      setDeckTracks((prev) => ({ ...prev, [deck]: track }))
      deckProgressRef.current = { ...deckProgressRef.current, [deck]: 0 }
      deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: 0 }
      deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: false }
      setDeckProgress((prev) => ({ ...prev, [deck]: 0 }))
      setDeckDurations((prev) => ({ ...prev, [deck]: 0 }))
      setDeckPlaying((prev) => ({ ...prev, [deck]: false }))
      setIsSpinningDown(false)
      setDeckVolume(deck, 100)
      if (deck === activeDeckRef.current) {
        setCurrentTrack(track)
        setProgress(0)
        setDuration(0)
        setIsPlaying(false)
      }
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
  }, [addTrackToHistory, clearPlayRetries, getDeckPlayer, requestDeckPlayback, setDeckVolume])

  const prepareIncomingDeck = useCallback((track: Track) => {
    const incomingDeck = getOtherDeck(activeDeckRef.current)
    const player = getDeckPlayer(incomingDeck)
    if (!player) return incomingDeck

    pendingTransitionDeckRef.current = incomingDeck
    pendingTransitionTrackRef.current = track
    if (deckTracksRef.current[incomingDeck]?.videoId !== track.videoId) {
      setDeckTracks((prev) => ({ ...prev, [incomingDeck]: track }))
      deckProgressRef.current = { ...deckProgressRef.current, [incomingDeck]: 0 }
      deckDurationsRef.current = { ...deckDurationsRef.current, [incomingDeck]: 0 }
      deckPlayingRef.current = { ...deckPlayingRef.current, [incomingDeck]: false }
      setDeckProgress((prev) => ({ ...prev, [incomingDeck]: 0 }))
      setDeckDurations((prev) => ({ ...prev, [incomingDeck]: 0 }))
      setDeckPlaying((prev) => ({ ...prev, [incomingDeck]: false }))
      setDeckVolume(incomingDeck, 100)
      player.cueVideoById(track.videoId)
    }

    return incomingDeck
  }, [getDeckPlayer, getOtherDeck, setDeckVolume])

  const playTrack = useCallback((track: Track, options: { mutedStart?: boolean; addToHistory?: boolean } = {}) => {
    if (playerReady) {
      startDeckTrack(activeDeckRef.current, track, true, options)
    }
  }, [playerReady, startDeckTrack])

  const loadTrack = useCallback((track: Track) => {
    if (playerReady) {
      startDeckTrack(activeDeckRef.current, track, false)
    }
  }, [playerReady, startDeckTrack])

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
    setPrimaryWidth("100%")
    setIncomingPanelWidth("0%")
    setActiveDeckVolume(100)
    transitionTriggered.current = false
    visualTransitionTriggered.current = false
    transitionCompleteTriggered.current = false
    pendingTransitionDeckRef.current = null
    pendingTransitionTrackRef.current = null
  }, [setActiveDeckVolume])

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
        setQueue((prev) => prev.slice(1))
        setTimeout(() => {
          startDeckTrack(activeDeckRef.current, nextTrack, true)
        }, 100)
      }
      return currentAutoplay
    })
  }, [startDeckTrack])

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded
  }, [handleTrackEnded])

  const completeOverlapTransition = useCallback((outgoingDeck: DeckId) => {
    const incomingDeck = pendingTransitionDeckRef.current ?? getOtherDeck(outgoingDeck)
    const incomingTrack = deckTracksRef.current[incomingDeck]
    if (!incomingTrack || transitionCompleteTriggered.current) return

    transitionCompleteTriggered.current = true
    setPrimaryWidth("0%")

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
      deckProgressRef.current = { ...deckProgressRef.current, [outgoingDeck]: 0 }
      deckDurationsRef.current = { ...deckDurationsRef.current, [outgoingDeck]: 0 }
      deckPlayingRef.current = { ...deckPlayingRef.current, [outgoingDeck]: false }
      setDeckProgress((prev) => ({ ...prev, [outgoingDeck]: 0 }))
      setDeckDurations((prev) => ({ ...prev, [outgoingDeck]: 0 }))
      setDeckPlaying((prev) => ({ ...prev, [outgoingDeck]: false }))
      setDeckVolume(incomingDeck, 100)
      setIsSpinningDown(false)
      setIncomingPanelWidth("100%")

      setTimeout(() => {
        setIsTransitioning(false)
        setPrimaryWidth("100%")
        setIncomingPanelWidth("0%")
        transitionTriggered.current = false
        visualTransitionTriggered.current = false
        transitionCompleteTriggered.current = false
        pendingTransitionDeckRef.current = null
        pendingTransitionTrackRef.current = null
      }, 700)
    }, 700)
  }, [getDeckPlayer, getOtherDeck, setDeckVolume])

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
          rel: 0,
        },
        events: {
          onReady: () => {
            setDeckReady((prev) => ({ ...prev, [deck]: true }))
            playerRefs.current[deck]?.setVolume(100)
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              deckPlayingRef.current = { ...deckPlayingRef.current, [deck]: true }
              setDeckPlaying((prev) => ({ ...prev, [deck]: true }))
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

    const initializeDecks = () => {
      if (apiReadyRef.current) return
      apiReadyRef.current = true
      createDeckPlayer("a")
      createDeckPlayer("b")
    }

    if (window.YT?.Player) {
      initializeDecks()
    } else {
      window.onYouTubeIframeAPIReady = initializeDecks
      if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }
    }

    return () => {
      clearPlayRetries()
      if (progressInterval.current) clearInterval(progressInterval.current)
      ;(["a", "b"] as DeckId[]).forEach((deck) => {
        try {
          playerRefs.current[deck]?.destroy()
        } catch {
          // Ignore cleanup errors.
        }
        playerRefs.current[deck] = null
      })
    }
  }, [clearPlayRetries])

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
      setActiveDeckVolume(100)
      return
    }

    const fadeWindowSeconds = overlapSeconds * 1.25
    if (!fadeWindowSeconds) {
      setActiveDeckVolume(100)
      return
    }

    const timeRemaining = duration - progress
    if (timeRemaining <= fadeWindowSeconds && timeRemaining > 0) {
      setActiveDeckVolume((timeRemaining / fadeWindowSeconds) * 100)
      if (timeRemaining > overlapSeconds) {
        prepareIncomingDeck(nextTrack)
      }
    } else {
      setActiveDeckVolume(100)
    }
  }, [progress, duration, overlap, autoplay, queue, overlapSeconds, isPlaying, setActiveDeckVolume, prepareIncomingDeck])

  // Bring the incoming track into view before audio overlap starts.
  useEffect(() => {
    const nextTrack = queue[0]
    if (overlap === "none" || !autoplay || !nextTrack || !duration || !isPlaying) {
      return
    }

    const timeRemaining = duration - progress
    const visualLeadSeconds = overlapSeconds + 5
    if (timeRemaining <= visualLeadSeconds && timeRemaining > overlapSeconds && !visualTransitionTriggered.current) {
      visualTransitionTriggered.current = true
      prepareIncomingDeck(nextTrack)
      showIncomingTransition()
      setQueue((prev) => prev[0]?.id === nextTrack.id ? prev.slice(1) : prev)
    }
  }, [progress, duration, overlap, autoplay, queue, overlapSeconds, prepareIncomingDeck, isPlaying, showIncomingTransition])

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
      setQueue((prev) => prev[0]?.id === nextTrack.id ? prev.slice(1) : prev)
      addTrackToHistory(nextTrack)
      requestDeckPlayback(incomingDeck)
    }
  }, [progress, duration, overlap, autoplay, queue, overlapSeconds, prepareIncomingDeck, isPlaying, addTrackToHistory, requestDeckPlayback, showIncomingTransition])

  // Update progress for both permanent decks.
  useEffect(() => {
    progressInterval.current = setInterval(() => {
      ;(["a", "b"] as DeckId[]).forEach((deck) => {
        const player = getDeckPlayer(deck)
        const track = deckTracksRef.current[deck]
        if (!player || !track) return

        try {
          const loadedVideoId = player.getVideoData().video_id
          if (loadedVideoId !== track.videoId) {
            deckProgressRef.current = { ...deckProgressRef.current, [deck]: 0 }
            deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: 0 }
            setDeckProgress((prev) => ({ ...prev, [deck]: 0 }))
            setDeckDurations((prev) => ({ ...prev, [deck]: 0 }))

            if (deck === activeDeckRef.current) {
              setProgress(0)
              setDuration(0)
            }

            return
          }

          const currentTime = player.getCurrentTime()
          const totalDuration = player.getDuration()
          deckProgressRef.current = { ...deckProgressRef.current, [deck]: currentTime }
          deckDurationsRef.current = { ...deckDurationsRef.current, [deck]: totalDuration }
          setDeckProgress((prev) => ({ ...prev, [deck]: currentTime }))
          setDeckDurations((prev) => ({ ...prev, [deck]: totalDuration }))

          if (deck === activeDeckRef.current) {
            setProgress(currentTime)
            setDuration(totalDuration)
          }
        } catch {
          // Player can briefly reject reads while a video is being cued.
        }
      })
    }, 100)

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [getDeckPlayer])

  const handleAddTrack = useCallback(() => {
    const videoId = extractVideoId(urlInput.trim())
    if (!videoId) {
      setUrlError("Please enter a valid YouTube URL")
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
    setUrlInput("")

    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.title !== "string" || !data.title) {
          showSingleSuccessToast("Added track")
          return
        }

        const applyTitle = (savedTrack: Track) => (
          savedTrack.id === track.id ? { ...savedTrack, title: data.title } : savedTrack
        )

        setCurrentTrack((current) => current ? applyTitle(current) : current)
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
  }, [urlInput, playerReady, autoplay, playTrack, loadTrack, showSingleSuccessToast])

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

  const handleSeek = useCallback((percentage: number) => {
    const deck = activeDeckRef.current
    const player = getDeckPlayer(deck)
    if (!player || !duration) return

    const seekTime = percentage * duration
    player.seekTo(seekTime, true)
    setDeckProgress((prev) => ({ ...prev, [deck]: seekTime }))
    setProgress(seekTime)
  }, [duration, getDeckPlayer])

  const handleSecondarySeek = useCallback((percentage: number) => {
    const deck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeckRef.current)
    const player = getDeckPlayer(deck)
    const deckDuration = deckDurations[deck]
    if (!player || !deckDuration) return

    const seekTime = percentage * deckDuration
    player.seekTo(seekTime, true)
    setDeckProgress((prev) => ({ ...prev, [deck]: seekTime }))
  }, [deckDurations, getDeckPlayer, getOtherDeck])

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

  const handleDragEnd = useCallback((event: DragEndEvent, orderedTracks?: Track[]) => {
    if (orderedTracks) {
      setQueue((items) => {
        if (orderedTracks.length === items.length) {
          return orderedTracks
        }

        const orderedTrackIds = new Set(orderedTracks.map((track) => track.id))
        let orderedIndex = 0

        return items.map((item) => (
          orderedTrackIds.has(item.id) ? orderedTracks[orderedIndex++] : item
        ))
      })
      return
    }

    const { active, over } = event
    if (over && active.id !== over.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
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
    setQueue([])
    setHistory([])
    setAutoplay(true)
    setOverlap("none")
    resetOverlapTransition()
  }, [resetOverlapTransition])

  const handleCopyTrack = useCallback((track: Track) => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${track.videoId}`)
  }, [])

  const handleRequeue = useCallback((track: Track) => {
    const newTrack = { ...track, id: `${track.videoId}-${Date.now()}`, addedAt: Date.now() }
    setQueue((prev) => [...prev, newTrack])
    showSingleSuccessToast(`Added "${track.title}" to the playlist`)
  }, [showSingleSuccessToast])

  const handlePlayFromQueue = useCallback((track: Track) => {
    setQueue((prev) => prev.filter((t) => t.id !== track.id))
    playTrack(track)
  }, [playTrack])

  const handleSkipNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = queue[0]
      setQueue((prev) => prev.slice(1))
      playTrack(nextTrack)
    }
  }, [queue, playTrack])

  const handleSkipBack = useCallback(() => {
    if (history.length > 0) {
      const prevTrack = history[0]
      if (currentTrack) {
        setQueue((prev) => [currentTrack, ...prev])
      }
      setHistory((prev) => prev.slice(1))
      playTrack(prevTrack, { addToHistory: false })
    }
  }, [history, currentTrack, playTrack])

  const incomingDeck = pendingTransitionDeckRef.current ?? getOtherDeck(activeDeck)
  const incomingTrack = deckTracks[incomingDeck]
  const incomingProgress = deckProgress[incomingDeck]
  const incomingDuration = deckDurations[incomingDeck]
  const incomingPlaying = deckPlaying[incomingDeck]

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Hidden YouTube Players */}
      <div className="hidden" id="player-container">
        <div id="youtube-player-a" />
        <div id="youtube-player-b" />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <Tooltip
        id="player-tooltip"
        className="player-tooltip"
        portalRoot={tooltipRoot}
        positionStrategy="fixed"
      />
      <ToastContainer
        position="bottom-center"
        theme="dark"
        autoClose={2500}
        hideProgressBar
        newestOnTop
        limit={1}
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover
      />

      {/* Main player container */}
      <div className="flex h-screen min-h-0 max-w-2xl mx-auto flex-col bg-card shadow-2xl overflow-hidden border-x border-border">
        <PlayerHeader
          autoplay={autoplay}
          overlap={overlap}
          onAutoplayToggle={handleAutoplayToggle}
          onOverlapChange={setOverlap}
          onHelpOpen={() => setShowHelp(true)}
        />

        {/* Player Section */}
        <div className="shrink-0 p-8 flex flex-col border-b border-border relative overflow-hidden">
          {previousBackgroundImage && (
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${
                isBackgroundFading ? "opacity-0" : "opacity-30"
              }`}
              style={{
                backgroundImage: `url(${previousBackgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(60px)",
                transform: "scale(1.2)",
              }}
            />
          )}
          {backgroundImage && (
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${
                isBackgroundFading ? "opacity-30" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(60px)",
                transform: "scale(1.2)",
              }}
            />
          )}

          <div
            className={`flex ${isTransitioning ? "transition-[column-gap] duration-700 ease-in-out" : ""}`}
            style={isTransitioning ? { columnGap: primaryWidth === "0%" || incomingPanelWidth === "0%" ? 0 : "1rem" } : undefined}
          >
            <div
              className={isTransitioning ? "overflow-hidden transition-[width] duration-700 ease-in-out will-change-[width]" : "flex flex-1"}
              style={isTransitioning ? { width: primaryWidth } : undefined}
            >
              <VinylPlayer
                track={currentTrack}
                isPlaying={isPlaying}
                isSpinningDown={isSpinningDown}
                progress={progress}
                duration={duration}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onSkipNext={handleSkipNext}
                onSkipBack={handleSkipBack}
                showBackButton={history.length > 0}
                isTransitioning={isTransitioning}
                transitionWidth={isTransitioning ? "100%" : primaryWidth}
                compactTitle={isTransitioning}
              />
            </div>
            
            {isTransitioning && incomingTrack && (
              <div
                key={incomingTrack.id}
                className={`box-border min-w-0 overflow-hidden transition-[flex-basis,max-width,opacity,transform,padding-left] duration-700 ease-in-out will-change-[flex-basis,max-width,opacity,transform] ${
                  primaryWidth === "0%" ? "pl-0" : "border-l border-border pl-4"
                }`}
                style={{
                  flexBasis: incomingPanelWidth,
                  maxWidth: incomingPanelWidth,
                  opacity: incomingPanelWidth === "0%" ? 0 : 1,
                  transform: incomingPanelWidth === "0%" ? "translateX(4rem)" : "translateX(0)",
                }}
              >
                <VinylPlayer
                  track={incomingTrack}
                  isPlaying={incomingPlaying}
                  isSpinningDown={false}
                  progress={incomingProgress}
                  duration={incomingDuration}
                  onPlayPause={handleSecondaryPlayPause}
                  onSeek={handleSecondarySeek}
                  onSkipNext={() => {}}
                  showBackButton={false}
                  isTransitioning={true}
                  transitionWidth="100%"
                  compactTitle
                />
              </div>
            )}
          </div>
        </div>

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
