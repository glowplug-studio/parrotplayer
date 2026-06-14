export interface Track {
  id: string
  videoId: string
  title: string
  thumbnail: string
  addedAt: number
  durationSeconds?: number
}

export const OVERLAP_OPTIONS = ["none", "2s", "4s", "10s"] as const

export type OverlapSetting = (typeof OVERLAP_OPTIONS)[number]

export const OVERLAP_LABELS: Record<OverlapSetting, string> = {
  none: "-",
  "2s": "2s",
  "4s": "4s",
  "10s": "10s",
}

export function isOverlapSetting(value: unknown): value is OverlapSetting {
  return typeof value === "string" && OVERLAP_OPTIONS.includes(value as OverlapSetting)
}

export type DeckId = "a" | "b"
export type DeckMap<T> = Record<DeckId, T>

export type StoredPlaylistTrack = {
  status: "queued" | "history"
  videoId: string
  title: string
  thumbnail: string
  addedAt: number
  durationSeconds?: number
}

export type StoredPlayerSettings = {
  autoplay: boolean
  overlap: OverlapSetting
  loopAll?: boolean
}

export interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getVideoData: () => { video_id?: string }
  getPlayerState: () => number
  loadVideoById: (videoId: string) => void
  cueVideoById: (videoId: string) => void
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  destroy: () => void
}

export type YouTubePlayerState = {
  ENDED: number
  PLAYING: number
  PAUSED: number
  BUFFERING: number
  CUED: number
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
          playerVars: Record<string, number | string>
          events: {
            onReady: () => void
            onStateChange: (event: { data: number; target: YouTubePlayer }) => void
          }
        }
      ) => YouTubePlayer
      PlayerState: YouTubePlayerState
    }
    onYouTubeIframeAPIReady: () => void
  }
}
