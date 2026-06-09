export interface Track {
  id: string
  videoId: string
  title: string
  thumbnail: string
  addedAt: number
}

export type OverlapSetting = "none" | "2s" | "4s" | "10s"
export type DeckId = "a" | "b"
export type DeckMap<T> = Record<DeckId, T>

export type StoredPlaylistTrack = {
  status: "queued" | "history"
  videoId: string
  title: string
  thumbnail: string
  addedAt: number
}

export type StoredPlayerSettings = {
  autoplay: boolean
  overlap: OverlapSetting
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
          playerVars: Record<string, number>
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
