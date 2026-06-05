"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Play, Pause, ChevronUp, ChevronDown, X, GripVertical, Plus, ToggleLeft, ToggleRight, SkipForward, SkipBack, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface Track {
  id: string
  videoId: string
  title: string
  thumbnail: string
  addedAt: number
}

interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  loadVideoById: (videoId: string) => void
  setVolume: (volume: number) => void
  destroy: () => void
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string
          width: string
          videoId: string
          playerVars: Record<string, number>
          events: {
            onReady: () => void
            onStateChange: (event: { data: number }) => void
          }
        }
      ) => YouTubePlayer
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function SortableTrack({
  track,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onPlay,
  isPulsing
}: {
  track: Track
  index: number
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
  onPlay: (track: Track) => void
  isPulsing: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg group transition-colors ${
        isPulsing ? "animate-pulse-red" : "bg-secondary/50 hover:bg-secondary"
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-primary font-bold w-6 text-center">{index + 1}</span>
      <button onClick={() => onPlay(track)} className="flex-shrink-0">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-12 h-12 rounded object-cover hover:ring-2 hover:ring-primary transition-all"
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveUp(track.id)}
          disabled={isFirst}
          className="h-8 w-8"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveDown(track.id)}
          disabled={isLast}
          className="h-8 w-8"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(track.id)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function HistoryTrack({ track, onRequeue }: { track: Track; onRequeue: (track: Track) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg group hover:bg-secondary/50 transition-colors">
      <img
        src={track.thumbnail}
        alt={track.title}
        className="w-12 h-12 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground">
          Played {new Date(track.addedAt).toLocaleTimeString()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRequeue(track)}
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}

function VinylPlayer({
  track,
  isPlaying,
  progress,
  duration,
  onPlayPause,
  onSeek,
  onSkipNext,
  onSkipBack,
  showBackButton,
  isTransitioning,
  transitionWidth
}: {
  track: Track | null
  isPlaying: boolean
  progress: number
  duration: number
  onPlayPause: () => void
  onSeek: (percentage: number) => void
  onSkipNext: () => void
  onSkipBack?: () => void
  showBackButton: boolean
  isTransitioning?: boolean
  transitionWidth?: string
}) {
  const progressBarRef = useRef<HTMLDivElement>(null)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
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
      className={`flex flex-col items-center transition-all duration-500 overflow-hidden ${isTransitioning ? "" : "flex-1"}`}
      style={isTransitioning ? { width: transitionWidth, minWidth: transitionWidth === "0%" ? "0" : "auto" } : {}}
    >
      {/* Vinyl Disc */}
      <div className="relative w-48 h-48 mb-6 z-10">
        {/* Outer black ring */}
        <div className="absolute inset-0 rounded-full bg-zinc-950 shadow-2xl" />
        {/* Thin groove ring */}
        <div className="absolute inset-1 rounded-full bg-zinc-900" />
        {/* Full artwork circle */}
        <div
          className={`absolute inset-2 rounded-full overflow-hidden shadow-inner ${
            isPlaying ? "animate-spin-slow" : "animate-spin-slow paused"
          }`}
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
        {/* Center hole */}
        <div className="absolute inset-[5.5rem] rounded-full bg-zinc-950 border-2 border-zinc-800" />
      </div>

      {/* Track Title - Much bigger */}
      <h3 className="text-3xl font-bold text-center mb-4 text-balance max-w-md z-10 leading-tight">
        {track?.title || "No track playing"}
      </h3>

      {/* Progress Bar */}
      <div className="w-full max-w-md z-10">
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="relative h-2 bg-muted rounded-full cursor-pointer group"
        >
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: duration ? `calc(${(progress / duration) * 100}% - 8px)` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-4 z-10">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkipBack}
            className="h-10 w-10"
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
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipNext}
          className="h-10 w-10"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-card p-6 rounded-xl max-w-md mx-4 shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">How to Use Parrot Player</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>1. Open YouTube in another browser tab</p>
          <p>2. Search for the videos you want to play</p>
          <p>3. Copy the video URL from your browser</p>
          <p>4. Paste it into the URL field below and click Add</p>
          <p>5. Manage your queue using drag and drop or the arrow buttons</p>
          <p>6. Enable autoplay to automatically play the next track</p>
          <p>7. Use overlap to crossfade between tracks</p>
        </div>
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Use <a href="https://brave.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Brave Browser</a> and <a href="https://ublockorigin.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">uBlock Origin</a> for an ad-free experience.
          </p>
        </div>
        <Button onClick={onClose} className="w-full mt-6">Got it</Button>
      </div>
    </div>
  )
}

export default function YouTubePlayerPage() {
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
  const [overlap, setOverlap] = useState<"none" | "1s" | "2s" | "4s">("none")
  const [isPulsing, setIsPulsing] = useState(false)
  
  // Secondary player for overlap
  const [secondaryTrack, setSecondaryTrack] = useState<Track | null>(null)
  const [secondaryProgress, setSecondaryProgress] = useState(0)
  const [secondaryDuration, setSecondaryDuration] = useState(0)
  const [secondaryPlaying, setSecondaryPlaying] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [primaryWidth, setPrimaryWidth] = useState("100%")
  const [secondaryWidth, setSecondaryWidth] = useState("0%")
  const [secondaryReady, setSecondaryReady] = useState(false)
  
  const playerRef = useRef<YouTubePlayer | null>(null)
  const secondaryPlayerRef = useRef<YouTubePlayer | null>(null)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondaryProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef = useRef<Track[]>([])
  const overlapRef = useRef(overlap)
  const transitionTriggered = useRef(false)
  const apiReadyRef = useRef(false)

  // Keep refs in sync
  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    overlapRef.current = overlap
  }, [overlap])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const overlapSeconds = overlap === "none" ? 0 : parseInt(overlap)

  // Pulsing effect for next track
  useEffect(() => {
    if (!autoplay || queue.length === 0 || !duration || !isPlaying) {
      setIsPulsing(false)
      return
    }

    const timeRemaining = duration - progress
    if (timeRemaining <= 8 && timeRemaining > 0) {
      const interval = setInterval(() => {
        setIsPulsing((prev) => !prev)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setIsPulsing(false)
    }
  }, [autoplay, queue.length, duration, progress, isPlaying])

  const createSecondaryPlayer = useCallback((track: Track) => {
    if (!apiReadyRef.current) return

    // Clean up existing secondary player
    if (secondaryPlayerRef.current) {
      try {
        secondaryPlayerRef.current.destroy()
      } catch {
        // Ignore errors
      }
      secondaryPlayerRef.current = null
    }

    // Create container if needed
    let container = document.getElementById("youtube-player-secondary")
    if (!container) {
      container = document.createElement("div")
      container.id = "youtube-player-secondary"
      document.getElementById("player-container")?.appendChild(container)
    }

    setSecondaryReady(false)
    secondaryPlayerRef.current = new window.YT.Player("youtube-player-secondary", {
      height: "1",
      width: "1",
      videoId: track.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          setSecondaryReady(true)
          setSecondaryPlaying(true)
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setSecondaryPlaying(true)
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setSecondaryPlaying(false)
          } else if (event.data === window.YT.PlayerState.ENDED) {
            // When secondary ends, it means the transition is complete
            setSecondaryPlaying(false)
          }
        },
      },
    })
    setSecondaryTrack(track)
  }, [])

  const playTrack = useCallback((track: Track) => {
    if (playerRef.current && playerReady) {
      setCurrentTrack(track)
      playerRef.current.loadVideoById(track.videoId)
      playerRef.current.playVideo()
      setProgress(0)
      transitionTriggered.current = false
    }
  }, [playerReady])

  // Initialize YouTube Player
  useEffect(() => {
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true
      playerRef.current = new window.YT.Player("youtube-player", {
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
          onReady: () => setPlayerReady(true),
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              // Handle track ended
              handleTrackEnded()
            }
          },
        },
      })
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
      if (secondaryProgressInterval.current) clearInterval(secondaryProgressInterval.current)
    }
  }, [])

  const handleTrackEnded = useCallback(() => {
    setAutoplay((currentAutoplay) => {
      if (currentAutoplay && queueRef.current.length > 0 && overlapRef.current === "none") {
        const nextTrack = queueRef.current[0]
        const prevTrack = currentTrackRef.current
        if (prevTrack) {
          setHistory((prev) => [prevTrack, ...prev].slice(0, 50))
        }
        setQueue((prev) => prev.slice(1))
        setTimeout(() => {
          if (playerRef.current) {
            setCurrentTrack(nextTrack)
            playerRef.current.loadVideoById(nextTrack.videoId)
            playerRef.current.playVideo()
            setProgress(0)
            transitionTriggered.current = false
          }
        }, 100)
      }
      return currentAutoplay
    })
  }, [])

  // Handle overlap transition
  useEffect(() => {
    if (overlap === "none" || !autoplay || queue.length === 0 || !duration || !isPlaying) {
      return
    }

    const timeRemaining = duration - progress
    if (timeRemaining <= overlapSeconds && timeRemaining > 0 && !transitionTriggered.current) {
      transitionTriggered.current = true
      const nextTrack = queue[0]
      
      // Start transition animation
      setIsTransitioning(true)
      setPrimaryWidth("50%")
      setSecondaryWidth("50%")
      
      // Create secondary player and start playing
      createSecondaryPlayer(nextTrack)
    }
  }, [progress, duration, overlap, autoplay, queue, overlapSeconds, createSecondaryPlayer, isPlaying])

  // Complete transition when primary ends
  useEffect(() => {
    if (isTransitioning && !isPlaying && secondaryPlaying) {
      // Primary has ended, animate it away
      setPrimaryWidth("0%")
      setSecondaryWidth("100%")
      
      setTimeout(() => {
        // Swap players
        const prevTrack = currentTrackRef.current
        if (prevTrack) {
          setHistory((prev) => [prevTrack, ...prev].slice(0, 50))
        }
        setQueue((prev) => prev.slice(1))
        
        // Make secondary the primary
        if (secondaryPlayerRef.current && secondaryTrack) {
          // Destroy old primary
          if (playerRef.current) {
            try {
              playerRef.current.destroy()
            } catch {
              // Ignore
            }
          }
          
          // Swap references
          playerRef.current = secondaryPlayerRef.current
          secondaryPlayerRef.current = null
          setCurrentTrack(secondaryTrack)
          setProgress(secondaryProgress)
          setDuration(secondaryDuration)
          setIsPlaying(secondaryPlaying)
          
          // Reset secondary
          setSecondaryTrack(null)
          setSecondaryProgress(0)
          setSecondaryDuration(0)
          setSecondaryPlaying(false)
          
          // Reset transition state
          setIsTransitioning(false)
          setPrimaryWidth("100%")
          setSecondaryWidth("0%")
          transitionTriggered.current = false
          
          // Recreate primary player element
          const container = document.getElementById("player-container")
          if (container) {
            const oldPlayer = document.getElementById("youtube-player")
            if (oldPlayer) oldPlayer.remove()
            const newPlayer = document.createElement("div")
            newPlayer.id = "youtube-player"
            container.appendChild(newPlayer)
          }
        }
      }, 500)
    }
  }, [isTransitioning, isPlaying, secondaryPlaying, secondaryTrack, secondaryProgress, secondaryDuration])

  // Update progress for primary player
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime()
          const totalDuration = playerRef.current.getDuration()
          setProgress(currentTime)
          setDuration(totalDuration)
        }
      }, 100)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [isPlaying])

  // Update progress for secondary player
  useEffect(() => {
    if (secondaryPlaying && secondaryPlayerRef.current) {
      secondaryProgressInterval.current = setInterval(() => {
        if (secondaryPlayerRef.current) {
          try {
            const currentTime = secondaryPlayerRef.current.getCurrentTime()
            const totalDuration = secondaryPlayerRef.current.getDuration()
            setSecondaryProgress(currentTime)
            setSecondaryDuration(totalDuration)
          } catch {
            // Player might not be ready
          }
        }
      }, 100)
    } else {
      if (secondaryProgressInterval.current) {
        clearInterval(secondaryProgressInterval.current)
        secondaryProgressInterval.current = null
      }
    }

    return () => {
      if (secondaryProgressInterval.current) clearInterval(secondaryProgressInterval.current)
    }
  }, [secondaryPlaying])

  const handleAddTrack = useCallback(async () => {
    const videoId = extractVideoId(urlInput.trim())
    if (!videoId) {
      setUrlError("Please enter a valid YouTube URL")
      return
    }

    setUrlError("")
    
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      const data = await response.json()
      
      const track: Track = {
        id: `${videoId}-${Date.now()}`,
        videoId,
        title: data.title || `Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        addedAt: Date.now(),
      }

      if (!currentTrackRef.current && playerReady) {
        playTrack(track)
      } else {
        setQueue((prev) => [...prev, track])
      }
      setUrlInput("")
    } catch {
      const track: Track = {
        id: `${videoId}-${Date.now()}`,
        videoId,
        title: `Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        addedAt: Date.now(),
      }

      if (!currentTrackRef.current && playerReady) {
        playTrack(track)
      } else {
        setQueue((prev) => [...prev, track])
      }
      setUrlInput("")
    }
  }, [urlInput, playerReady, playTrack])

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const handleSeek = useCallback((percentage: number) => {
    if (!playerRef.current || !duration) return
    const seekTime = percentage * duration
    playerRef.current.seekTo(seekTime, true)
    setProgress(seekTime)
  }, [duration])

  const handleSecondarySeek = useCallback((percentage: number) => {
    if (!secondaryPlayerRef.current || !secondaryDuration) return
    const seekTime = percentage * secondaryDuration
    secondaryPlayerRef.current.seekTo(seekTime, true)
    setSecondaryProgress(seekTime)
  }, [secondaryDuration])

  const handleSecondaryPlayPause = useCallback(() => {
    if (!secondaryPlayerRef.current) return
    if (secondaryPlaying) {
      secondaryPlayerRef.current.pauseVideo()
    } else {
      secondaryPlayerRef.current.playVideo()
    }
  }, [secondaryPlaying])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
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

  const handleRequeue = useCallback((track: Track) => {
    const newTrack = { ...track, id: `${track.videoId}-${Date.now()}`, addedAt: Date.now() }
    setQueue((prev) => [...prev, newTrack])
  }, [])

  const handlePlayFromQueue = useCallback((track: Track) => {
    if (currentTrack) {
      setHistory((prev) => [currentTrack, ...prev].slice(0, 50))
    }
    setQueue((prev) => prev.filter((t) => t.id !== track.id))
    playTrack(track)
  }, [currentTrack, playTrack])

  const handleSkipNext = useCallback(() => {
    if (queue.length > 0) {
      if (currentTrack) {
        setHistory((prev) => [currentTrack, ...prev].slice(0, 50))
      }
      const nextTrack = queue[0]
      setQueue((prev) => prev.slice(1))
      playTrack(nextTrack)
    }
  }, [queue, currentTrack, playTrack])

  const handleSkipBack = useCallback(() => {
    if (history.length > 0) {
      const prevTrack = history[0]
      if (currentTrack) {
        setQueue((prev) => [currentTrack, ...prev])
      }
      setHistory((prev) => prev.slice(1))
      playTrack(prevTrack)
    }
  }, [history, currentTrack, playTrack])

  // Suppress the unused variable warning for secondaryReady
  void secondaryReady

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Hidden YouTube Players */}
      <div className="hidden" id="player-container">
        <div id="youtube-player" />
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Main container with rounded corners and shadow */}
      <div className="flex flex-col min-h-[calc(100vh-2rem)] max-w-2xl mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
        {/* Header with logo and help */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
          <div className="flex items-center gap-3">
            <Image
              src="/parrot-logo.png"
              alt="Parrot Player"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <h1 className="text-xl font-bold">Parrot Player</h1>
          </div>
        <div className="flex items-center gap-4">
          <a
            href="https://brave.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Download Brave Browser"
          >
            <img src="/brave-logo.svg" alt="Brave" className="w-5 h-5" />
          </a>
          <a
            href="https://ublockorigin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Get uBlock Origin"
          >
            <img src="/ublock-logo.svg" alt="uBlock Origin" className="w-5 h-5" />
          </a>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">Help</span>
          </button>
        </div>
        </div>

        {/* Player Section */}
        <div className="p-8 flex flex-col border-b border-border relative overflow-hidden">
          {/* Background blur - more visible */}
          {currentTrack && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${currentTrack.thumbnail})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(60px)",
                opacity: 0.3,
                transform: "scale(1.2)"
              }}
            />
          )}

          <div className={`flex ${isTransitioning ? "gap-4" : ""}`}>
            <VinylPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              duration={duration}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onSkipNext={handleSkipNext}
              onSkipBack={handleSkipBack}
              showBackButton={history.length > 0}
              isTransitioning={isTransitioning}
              transitionWidth={primaryWidth}
            />
            
            {isTransitioning && secondaryTrack && (
              <VinylPlayer
                track={secondaryTrack}
                isPlaying={secondaryPlaying}
                progress={secondaryProgress}
                duration={secondaryDuration}
                onPlayPause={handleSecondaryPlayPause}
                onSeek={handleSecondarySeek}
                onSkipNext={() => {}}
                showBackButton={false}
                isTransitioning={true}
                transitionWidth={secondaryWidth}
              />
            )}
          </div>

          {/* Autoplay & Overlap Controls */}
          <div className="flex items-center justify-center gap-6 mt-6 z-10">
            <button
              onClick={() => setAutoplay(!autoplay)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {autoplay ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6" />
              )}
              Autoplay
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Overlap:</span>
              <select
                value={overlap}
                onChange={(e) => setOverlap(e.target.value as typeof overlap)}
                className="bg-card border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="none">None</option>
                <option value="1s">1s</option>
                <option value="2s">2s</option>
                <option value="4s">4s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Track Form */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Paste YouTube URL here..."
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setUrlError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAddTrack()}
                className={`!bg-white !text-zinc-900 placeholder:!text-zinc-500 border-2 focus:border-primary ${urlError ? "border-destructive" : "border-zinc-300"}`}
              />
              {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
            </div>
            <Button onClick={handleAddTrack} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "queue"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4">
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
                        onRemove={handleRemove}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isFirst={index === 0}
                        isLast={index === queue.length - 1}
                        onPlay={handlePlayFromQueue}
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
                <HistoryTrack key={track.id} track={track} onRequeue={handleRequeue} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p className="text-sm">No history yet</p>
              <p className="text-xs mt-1">Played tracks will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
