"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const VercelAnalytics = dynamic(() => import("@vercel/analytics/next").then((module) => module.Analytics), {
  ssr: false,
})

const GA_MEASUREMENT_ID = "G-SSJVLZ66PC"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function loadGoogleAnalytics() {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }

  window.gtag("js", new Date())
  window.gtag("config", GA_MEASUREMENT_ID)

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export function DeferredAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const enableAnalytics = () => setEnabled(true)
    const listenerOptions: AddEventListenerOptions = { once: true, passive: true }

    window.addEventListener("pointerdown", enableAnalytics, listenerOptions)
    window.addEventListener("keydown", enableAnalytics, { once: true })
    window.addEventListener("touchstart", enableAnalytics, listenerOptions)

    return () => {
      window.removeEventListener("pointerdown", enableAnalytics)
      window.removeEventListener("keydown", enableAnalytics)
      window.removeEventListener("touchstart", enableAnalytics)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    loadGoogleAnalytics()
  }, [enabled])

  if (process.env.NODE_ENV !== "production" || !enabled) return null

  return <VercelAnalytics />
}
