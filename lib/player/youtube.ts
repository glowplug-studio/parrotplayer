export const PLAYLIST_STORAGE_KEY = "parrotplayer-playlist"
export const SETTINGS_STORAGE_KEY = "parrotplayer-settings"
export const PLAYER_TITLE_STORAGE_KEY = "parrotplayer-title"

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}
