"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

import { PLAYER_TITLE_STORAGE_KEY } from "@/lib/player/youtube"

export const DEFAULT_PLAYER_TITLE = "Parrot Player"

export function usePlayerTitleStorage(): [string, Dispatch<SetStateAction<string>>] {
  const [playerTitle, setPlayerTitle] = useState(DEFAULT_PLAYER_TITLE)
  const [hasLoadedStoredTitle, setHasLoadedStoredTitle] = useState(false)

  useEffect(() => {
    try {
      const storedTitle = window.localStorage.getItem(PLAYER_TITLE_STORAGE_KEY)
      if (storedTitle) {
        setPlayerTitle(storedTitle)
      }
    } catch {
      // Ignore invalid saved title state.
    } finally {
      setHasLoadedStoredTitle(true)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedStoredTitle) return

    try {
      window.localStorage.setItem(PLAYER_TITLE_STORAGE_KEY, playerTitle)
    } catch {
      // Ignore storage write failures so the player stays usable.
    }
  }, [hasLoadedStoredTitle, playerTitle])

  return [playerTitle, setPlayerTitle]
}
