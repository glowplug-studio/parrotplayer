"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { BACKGROUND_FADE_MS } from "@/lib/player/constants"

type BackgroundLayerIndex = 0 | 1
type BackgroundLayers = [string | null, string | null]

export function useBackgroundCrossfade(initialImage: string | null = null) {
  const [backgroundLayers, setBackgroundLayers] = useState<BackgroundLayers>([initialImage, null])
  const [visibleBackgroundLayer, setVisibleBackgroundLayer] = useState<BackgroundLayerIndex>(0)
  const [fadingBackgroundLayer, setFadingBackgroundLayer] = useState<BackgroundLayerIndex | null>(null)

  const backgroundImageRef = useRef<string | null>(initialImage)
  const visibleBackgroundLayerRef = useRef<BackgroundLayerIndex>(0)
  const fadingBackgroundLayerRef = useRef<BackgroundLayerIndex | null>(null)
  const backgroundFadeFrameRef = useRef<{ first: number | null; second: number | null }>({ first: null, second: null })
  const backgroundFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    visibleBackgroundLayerRef.current = visibleBackgroundLayer
  }, [visibleBackgroundLayer])

  useEffect(() => {
    fadingBackgroundLayerRef.current = fadingBackgroundLayer
  }, [fadingBackgroundLayer])

  const clearPendingFade = useCallback(() => {
    if (backgroundFadeFrameRef.current.first !== null) {
      cancelAnimationFrame(backgroundFadeFrameRef.current.first)
    }
    if (backgroundFadeFrameRef.current.second !== null) {
      cancelAnimationFrame(backgroundFadeFrameRef.current.second)
    }
    if (backgroundFadeTimeoutRef.current) {
      clearTimeout(backgroundFadeTimeoutRef.current)
    }
    backgroundFadeFrameRef.current = { first: null, second: null }
    backgroundFadeTimeoutRef.current = null
  }, [])

  const crossfadeBackgroundTo = useCallback(
    (nextBackgroundImage: string | null) => {
      if (nextBackgroundImage === backgroundImageRef.current) return

      clearPendingFade()

      const previousImage = backgroundImageRef.current
      const currentVisibleLayer = fadingBackgroundLayerRef.current ?? visibleBackgroundLayerRef.current
      if (fadingBackgroundLayerRef.current !== null) {
        visibleBackgroundLayerRef.current = fadingBackgroundLayerRef.current
        setVisibleBackgroundLayer(fadingBackgroundLayerRef.current)
        setFadingBackgroundLayer(null)
        fadingBackgroundLayerRef.current = null
      }

      backgroundImageRef.current = nextBackgroundImage

      if (!previousImage) {
        visibleBackgroundLayerRef.current = currentVisibleLayer
        setVisibleBackgroundLayer(currentVisibleLayer)
        setFadingBackgroundLayer(null)
        setBackgroundLayers((prev) => {
          const next: BackgroundLayers = [...prev] as BackgroundLayers
          next[currentVisibleLayer] = nextBackgroundImage
          next[currentVisibleLayer === 0 ? 1 : 0] = null
          return next
        })
        return
      }

      const nextLayer = currentVisibleLayer === 0 ? 1 : 0
      setFadingBackgroundLayer(null)
      setBackgroundLayers((prev) => {
        const next: BackgroundLayers = [...prev] as BackgroundLayers
        next[nextLayer] = nextBackgroundImage
        return next
      })

      if (nextBackgroundImage) {
        backgroundFadeFrameRef.current.first = requestAnimationFrame(() => {
          backgroundFadeFrameRef.current.second = requestAnimationFrame(() => {
            fadingBackgroundLayerRef.current = nextLayer
            setFadingBackgroundLayer(nextLayer)
            backgroundFadeFrameRef.current = { first: null, second: null }
          })
        })
      } else {
        fadingBackgroundLayerRef.current = null
        setFadingBackgroundLayer(null)
      }

      backgroundFadeTimeoutRef.current = setTimeout(() => {
        visibleBackgroundLayerRef.current = nextLayer
        fadingBackgroundLayerRef.current = null
        setVisibleBackgroundLayer(nextLayer)
        setFadingBackgroundLayer(null)
        setBackgroundLayers((prev) => {
          const next: BackgroundLayers = [...prev] as BackgroundLayers
          next[currentVisibleLayer] = null
          return next
        })
        backgroundFadeTimeoutRef.current = null
      }, BACKGROUND_FADE_MS)
    },
    [clearPendingFade]
  )

  useEffect(() => clearPendingFade, [clearPendingFade])

  return {
    backgroundLayers,
    visibleBackgroundLayer,
    fadingBackgroundLayer,
    crossfadeBackgroundTo,
  }
}
