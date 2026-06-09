"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

import { restoreStoredPlaylist, serializePlaylist } from "@/lib/player/playlist-storage"
import type { Track } from "@/lib/player/types"
import { PLAYLIST_STORAGE_KEY } from "@/lib/player/youtube"

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

      const restoredPlaylist = restoreStoredPlaylist(parsed)
      setQueue(restoredPlaylist.queue)
      setHistory(restoredPlaylist.history)
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

    const playlist = serializePlaylist(queue, history)

    try {
      window.localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlist))
    } catch {
      // Ignore storage write failures so playback stays usable.
    }
  }, [queue, history, hasLoadedStoredPlaylist])

  return hasLoadedStoredPlaylist
}
