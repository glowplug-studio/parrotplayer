"use client"

import { useEffect } from "react"

const SATOSHI_FONT_URL = "/fonts/Satoshi-Regular.woff2"

export function LocalFontLoader() {
  useEffect(() => {
    let cancelled = false
    let hasStartedLoading = false

    const loadFont = async () => {
      if (hasStartedLoading) return
      hasStartedLoading = true

      if (!("fonts" in document) || !("FontFace" in window)) {
        document.documentElement.classList.add("satoshi-ready")
        return
      }

      try {
        const font = new FontFace("Satoshi", `url(${SATOSHI_FONT_URL}) format("woff2")`, {
          display: "optional",
          style: "normal",
          weight: "400 900",
        })
        const loadedFont = await font.load()
        if (cancelled) return

        document.fonts.add(loadedFont)
        document.documentElement.classList.add("satoshi-ready")
      } catch {
        // Keep the system font stack if the optional local font cannot load.
      }
    }

    const loadFontAfterFirstPaint = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(loadFont)
      })
    }

    const hasFirstContentfulPaint = performance
      .getEntriesByType("paint")
      .some((entry) => entry.name === "first-contentful-paint")

    if (hasFirstContentfulPaint) {
      loadFontAfterFirstPaint()
      return () => {
        cancelled = true
      }
    }

    if (!("PerformanceObserver" in window)) {
      loadFontAfterFirstPaint()
      return () => {
        cancelled = true
      }
    }

    const paintObserver = new PerformanceObserver((entryList) => {
      if (entryList.getEntries().some((entry) => entry.name === "first-contentful-paint")) {
        paintObserver.disconnect()
        loadFontAfterFirstPaint()
      }
    })

    try {
      paintObserver.observe({ type: "paint", buffered: true })
    } catch {
      loadFontAfterFirstPaint()
    }

    return () => {
      cancelled = true
      paintObserver.disconnect()
    }
  }, [])

  return null
}
