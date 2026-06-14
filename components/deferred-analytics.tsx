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
    let cancelled = false

    const enableAnalyticsAfterPaint = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setEnabled(true)
        })
      })
    }

    const hasFirstContentfulPaint = performance
      .getEntriesByType("paint")
      .some((entry) => entry.name === "first-contentful-paint")

    if (hasFirstContentfulPaint) {
      enableAnalyticsAfterPaint()
      return () => {
        cancelled = true
      }
    }

    if (!("PerformanceObserver" in window)) {
      enableAnalyticsAfterPaint()
      return () => {
        cancelled = true
      }
    }

    const paintObserver = new PerformanceObserver((entryList) => {
      if (entryList.getEntries().some((entry) => entry.name === "first-contentful-paint")) {
        paintObserver.disconnect()
        enableAnalyticsAfterPaint()
      }
    })

    try {
      paintObserver.observe({ type: "paint", buffered: true })
    } catch {
      enableAnalyticsAfterPaint()
    }

    return () => {
      cancelled = true
      paintObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    loadGoogleAnalytics()
  }, [enabled])

  if (process.env.NODE_ENV !== "production" || !enabled) return null

  return <VercelAnalytics />
}
