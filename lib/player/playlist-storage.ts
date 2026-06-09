import { normalizeHistory } from "@/lib/player/history"
import type { StoredPlaylistTrack, Track } from "@/lib/player/types"
import { extractVideoId } from "@/lib/player/youtube"

export type RestoredPlaylist = {
  queue: Track[]
  history: Track[]
}

function toTrack(track: StoredPlaylistTrack & { id: string }): Track {
  return {
    id: track.id,
    videoId: track.videoId,
    title: track.title,
    thumbnail: track.thumbnail,
    addedAt: track.addedAt,
  }
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

      return [
        {
          status: item.status,
          id: `${videoId}-stored-${index}-${addedAt}`,
          videoId,
          title: typeof item.title === "string" && item.title ? item.title : `Video ${videoId}`,
          thumbnail:
            typeof item.thumbnail === "string" && item.thumbnail
              ? item.thumbnail
              : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          addedAt,
        },
      ]
    }
  )

  return {
    queue: restoredTracks.filter((track) => track.status === "queued").map(toTrack),
    history: normalizeHistory(restoredTracks.filter((track) => track.status === "history").map(toTrack)),
  }
}

export function serializePlaylist(queue: Track[], history: Track[]): StoredPlaylistTrack[] {
  return [
    ...queue.map((track) => ({
      status: "queued" as const,
      videoId: track.videoId,
      title: track.title,
      thumbnail: track.thumbnail,
      addedAt: track.addedAt,
    })),
    ...normalizeHistory(history).map((track) => ({
      status: "history" as const,
      videoId: track.videoId,
      title: track.title,
      thumbnail: track.thumbnail,
      addedAt: track.addedAt,
    })),
  ]
}
