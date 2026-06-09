import type { Track } from "@/lib/player/types"

export function sortHistoryByPlayedTime(tracks: Track[]) {
  return [...tracks].sort((a, b) => b.addedAt - a.addedAt)
}

export function normalizeHistory(tracks: Track[]) {
  const seen = new Set<string>()

  return sortHistoryByPlayedTime(tracks).filter((track) => {
    const identity = track.videoId || track.id
    if (seen.has(identity)) return false

    seen.add(identity)
    return true
  })
}

export function addPlayedTrackToHistory(history: Track[], track: Track) {
  const playedTrack = { ...track, addedAt: Date.now() }

  return normalizeHistory([
    playedTrack,
    ...history.filter((historyTrack) => historyTrack.id !== track.id && historyTrack.videoId !== track.videoId),
  ]).slice(0, 50)
}
