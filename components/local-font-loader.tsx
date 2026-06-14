"use client"

import { useEffect } from "react"

const SATOSHI_FONT_URL = "/fonts/Satoshi-Regular.woff2"

export function LocalFontLoader() {
  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    const loadFont = async () => {
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

    const scheduleFontLoad = () => {
      timeoutId = window.setTimeout(loadFont, 2500)
    }

    if (document.readyState === "complete") {
      scheduleFontLoad()
    } else {
      window.addEventListener("load", scheduleFontLoad, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener("load", scheduleFontLoad)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  return null
}
