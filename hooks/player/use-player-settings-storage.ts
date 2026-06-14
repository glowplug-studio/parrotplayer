"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

import { isOverlapSetting, type OverlapSetting, type StoredPlayerSettings } from "@/lib/player/types"
import { SETTINGS_STORAGE_KEY } from "@/lib/player/youtube"

export function usePlayerSettingsStorage({
  autoplay,
  setAutoplay,
  overlap,
  setOverlap,
  loopAll,
  setLoopAll,
  isPlayerCollapsed,
  setIsPlayerCollapsed,
}: {
  autoplay: boolean
  setAutoplay: Dispatch<SetStateAction<boolean>>
  overlap: OverlapSetting
  setOverlap: Dispatch<SetStateAction<OverlapSetting>>
  loopAll: boolean
  setLoopAll: Dispatch<SetStateAction<boolean>>
  isPlayerCollapsed: boolean
  setIsPlayerCollapsed: Dispatch<SetStateAction<boolean>>
}) {
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false)

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!storedSettings) return

      const parsed = JSON.parse(storedSettings) as Partial<
        Omit<StoredPlayerSettings, "overlap"> & { overlap: OverlapSetting | "1s" }
      >
      if (typeof parsed.autoplay === "boolean") {
        setAutoplay(parsed.autoplay)
      }
      if (parsed.overlap === "1s") {
        setOverlap("none")
      } else if (isOverlapSetting(parsed.overlap)) {
        setOverlap(parsed.overlap)
      }
      if (typeof parsed.loopAll === "boolean") {
        setLoopAll(parsed.loopAll)
      }
      if (typeof parsed.isPlayerCollapsed === "boolean") {
        setIsPlayerCollapsed(parsed.isPlayerCollapsed)
      }
    } catch {
      // Ignore invalid saved settings.
    } finally {
      setHasLoadedStoredSettings(true)
    }
  }, [setAutoplay, setIsPlayerCollapsed, setLoopAll, setOverlap])

  useEffect(() => {
    if (!hasLoadedStoredSettings) return

    if (autoplay && overlap === "none" && !loopAll && !isPlayerCollapsed) {
      try {
        window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
      } catch {
        // Ignore storage write failures so playback stays usable.
      }
      return
    }

    const settings: StoredPlayerSettings = { autoplay, overlap, loopAll, isPlayerCollapsed }
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage write failures so playback stays usable.
    }
  }, [autoplay, overlap, loopAll, isPlayerCollapsed, hasLoadedStoredSettings])

  return hasLoadedStoredSettings
}
