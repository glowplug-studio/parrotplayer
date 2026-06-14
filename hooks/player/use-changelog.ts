"use client"

import { useEffect, useState } from "react"

export type ChangelogRelease = {
  version: string
  date: string
  description: string
}

export type Changelog = {
  latestVersion: string
  releases: ChangelogRelease[]
}

function isChangelogRelease(value: unknown): value is ChangelogRelease {
  if (!value || typeof value !== "object") return false

  const release = value as Partial<ChangelogRelease>
  return (
    typeof release.version === "string" && typeof release.date === "string" && typeof release.description === "string"
  )
}

function isChangelog(value: unknown): value is Changelog {
  if (!value || typeof value !== "object") return false

  const changelog = value as Partial<Changelog>
  return (
    typeof changelog.latestVersion === "string" &&
    Array.isArray(changelog.releases) &&
    changelog.releases.every(isChangelogRelease)
  )
}

export function useChangelog() {
  const [changelog, setChangelog] = useState<Changelog | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()

    async function loadChangelog() {
      try {
        const response = await fetch("/changelog.json", { signal: abortController.signal })
        if (!response.ok) {
          throw new Error("Unable to load changelog")
        }

        const parsedChangelog: unknown = await response.json()
        if (!isChangelog(parsedChangelog)) {
          throw new Error("Invalid changelog format")
        }

        setChangelog(parsedChangelog)
      } catch {
        if (abortController.signal.aborted) return

        setHasError(true)
      }
    }

    loadChangelog()

    return () => {
      abortController.abort()
    }
  }, [])

  return { changelog, hasError }
}
