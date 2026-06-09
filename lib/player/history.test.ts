import { describe, expect, it } from "vitest"

import { addPlayedTrackToHistory, normalizeHistory } from "@/lib/player/history"
import type { Track } from "@/lib/player/types"

const firstTrack: Track = {
  id: "a",
  videoId: "video-a",
  title: "First",
  thumbnail: "first.jpg",
  addedAt: 100,
}

const secondTrack: Track = {
  id: "b",
  videoId: "video-b",
  title: "Second",
  thumbnail: "second.jpg",
  addedAt: 200,
}

describe("history", () => {
  it("keeps most recent tracks first", () => {
    expect(normalizeHistory([firstTrack, secondTrack]).map((track) => track.videoId)).toEqual(["video-b", "video-a"])
  })

  it("updates an existing video and moves it to the top", () => {
    const updated = addPlayedTrackToHistory([secondTrack, firstTrack], {
      ...firstTrack,
      title: "First updated",
      addedAt: 300,
    })

    expect(updated).toHaveLength(2)
    expect(updated[0]).toMatchObject({
      videoId: "video-a",
      title: "First updated",
    })
    expect(updated[0]?.addedAt).toBeGreaterThan(200)
  })
})
