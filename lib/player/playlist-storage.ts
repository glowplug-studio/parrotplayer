import { normalizeHistory } from "@/lib/player/history"
import type { StoredPlaylistTrack, Track } from "@/lib/player/types"
import { extractVideoId } from "@/lib/player/youtube"

export type RestoredPlaylist = {
  queue: Track[]
  history: Track[]
}

function toTrack(track: StoredPlaylistTrack & { id: string }): Track {
  const restoredTrack: Track = {
    id: track.id,
    videoId: track.videoId,
    title: track.title,
    thumbnail: track.thumbnail,
    addedAt: track.addedAt,
  }

  if (typeof track.durationSeconds === "number" && track.durationSeconds > 0) {
    restoredTrack.durationSeconds = track.durationSeconds
  }

  return restoredTrack
}

export function restoreStoredPlaylist(value: unknown, now = Date.now()): RestoredPlaylist {
  if (!Array.isArray(value)) {
    return { queue: [], history: [] }
  }

  const restoredTracks = value.flatMap(
    (item: Partial<StoredPlaylistTrack>, index): Array<StoredPlaylistTrack & { id: string }> => {
      if (
        (item.status !== "queued" && item.status !== "history") ||
        typeof item.videoId !== "string" ||
        !extractVideoId(item.videoId)
      ) {
        return []
      }

      const videoId = item.videoId
      const addedAt = typeof item.addedAt === "number" ? item.addedAt : now
      const restoredTrack: StoredPlaylistTrack & { id: string } = {
        status: item.status,
        id: `${videoId}-stored-${index}-${addedAt}`,
        videoId,
        title: typeof item.title === "string" && item.title ? item.title : `Video ${videoId}`,
        thumbnail:
          typeof item.thumbnail === "string" && item.thumbnail
            ? item.thumbnail
            : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        addedAt,
      }

      if (typeof item.durationSeconds === "number" && item.durationSeconds > 0) {
        restoredTrack.durationSeconds = item.durationSeconds
      }

      return [restoredTrack]
    }
  )

  return {
    queue: restoredTracks.filter((track) => track.status === "queued").map(toTrack),
    history: normalizeHistory(restoredTracks.filter((track) => track.status === "history").map(toTrack)),
  }
}

export function serializePlaylist(queue: Track[], history: Track[]): StoredPlaylistTrack[] {
  const serializeTrack = (track: Track, status: StoredPlaylistTrack["status"]): StoredPlaylistTrack => {
    const storedTrack: StoredPlaylistTrack = {
      status,
      videoId: track.videoId,
      title: track.title,
      thumbnail: track.thumbnail,
      addedAt: track.addedAt,
    }

    if (typeof track.durationSeconds === "number" && track.durationSeconds > 0) {
      storedTrack.durationSeconds = track.durationSeconds
    }

    return storedTrack
  }

  return [
    ...queue.map((track) => serializeTrack(track, "queued")),
    ...normalizeHistory(history).map((track) => serializeTrack(track, "history")),
  ]
}
