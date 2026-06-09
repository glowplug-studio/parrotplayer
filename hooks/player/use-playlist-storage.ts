"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

import { normalizeHistory } from "@/lib/player/history"
import type { StoredPlaylistTrack, Track } from "@/lib/player/types"
import { extractVideoId, PLAYLIST_STORAGE_KEY } from "@/lib/player/youtube"

export function usePlaylistStorage({
  queue,
  setQueue,
  history,
  setHistory,
}: {
  queue: Track[]
  setQueue: Dispatch<SetStateAction<Track[]>>
  history: Track[]
  setHistory: Dispatch<SetStateAction<Track[]>>
}) {
  const [hasLoadedStoredPlaylist, setHasLoadedStoredPlaylist] = useState(false)

  useEffect(() => {
    try {
      const storedPlaylist = window.localStorage.getItem(PLAYLIST_STORAGE_KEY)
      if (!storedPlaylist) {
        return
      }

      const parsed = JSON.parse(storedPlaylist)
      if (!Array.isArray(parsed)) {
        return
      }

      const restoredTracks = parsed.flatMap((item: Partial<StoredPlaylistTrack>, index): Array<StoredPlaylistTrack & { id: string }> => {
        if (
          (item.status !== "queued" && item.status !== "history") ||
          typeof item.videoId !== "string" ||
          !extractVideoId(item.videoId)
        ) {
          return []
        }

        const videoId = item.videoId
        return [{
          status: item.status,
          id: `${videoId}-stored-${index}-${item.addedAt || Date.now()}`,
          videoId,
          title: typeof item.title === "string" && item.title ? item.title : `Video ${videoId}`,
          thumbnail: typeof item.thumbnail === "string" && item.thumbnail
            ? item.thumbnail
            : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          addedAt: typeof item.addedAt === "number" ? item.addedAt : Date.now(),
        }]
      })

      setQueue(restoredTracks.filter((track) => track.status === "queued").map((track) => ({
        id: track.id,
        videoId: track.videoId,
        title: track.title,
        thumbnail: track.thumbnail,
        addedAt: track.addedAt,
      })))
      setHistory(normalizeHistory(
        restoredTracks.filter((track) => track.status === "history").map((track) => ({
          id: track.id,
          videoId: track.videoId,
          title: track.title,
          thumbnail: track.thumbnail,
          addedAt: track.addedAt,
        }))
      ))
    } catch {
      // Ignore invalid saved playlists.
    } finally {
      setHasLoadedStoredPlaylist(true)
    }
  }, [setHistory, setQueue])

  useEffect(() => {
    if (!hasLoadedStoredPlaylist) return

    if (queue.length === 0 && history.length === 0) {
      try {
        window.localStorage.removeItem(PLAYLIST_STORAGE_KEY)
      } catch {
        // Ignore storage write failures so playback stays usable.
      }
      return
    }

    const playlist: StoredPlaylistTrack[] = [
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

    try {
      window.localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlist))
    } catch {
      // Ignore storage write failures so playback stays usable.
    }
  }, [queue, history, hasLoadedStoredPlaylist])

  return hasLoadedStoredPlaylist
}
