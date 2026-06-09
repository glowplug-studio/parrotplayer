import { describe, expect, it } from "vitest"

import { restoreStoredPlaylist, serializePlaylist } from "@/lib/player/playlist-storage"
import type { Track } from "@/lib/player/types"

const queuedTrack: Track = {
  id: "queue-1",
  videoId: "dQw4w9WgXcQ",
  title: "Queued",
  thumbnail: "queued.jpg",
  addedAt: 100,
  durationSeconds: 213,
}

const historyTrack: Track = {
  id: "history-1",
  videoId: "9bZkp7q19f0",
  title: "Played",
  thumbnail: "played.jpg",
  addedAt: 200,
}

describe("playlist storage", () => {
  it("serializes queue and history with storage statuses", () => {
    expect(serializePlaylist([queuedTrack], [historyTrack])).toEqual([
      {
        status: "queued",
        videoId: queuedTrack.videoId,
        title: queuedTrack.title,
        thumbnail: queuedTrack.thumbnail,
        addedAt: queuedTrack.addedAt,
        durationSeconds: queuedTrack.durationSeconds,
      },
      {
        status: "history",
        videoId: historyTrack.videoId,
        title: historyTrack.title,
        thumbnail: historyTrack.thumbnail,
        addedAt: historyTrack.addedAt,
      },
    ])
  })

  it("restores valid items and ignores invalid records", () => {
    const restored = restoreStoredPlaylist([
      {
        status: "queued",
        videoId: queuedTrack.videoId,
        title: queuedTrack.title,
        thumbnail: queuedTrack.thumbnail,
        addedAt: queuedTrack.addedAt,
      },
      {
        status: "history",
        videoId: historyTrack.videoId,
        title: historyTrack.title,
        thumbnail: historyTrack.thumbnail,
        addedAt: historyTrack.addedAt,
      },
      { status: "queued", videoId: "not-a-video-id" },
      { status: "unknown", videoId: queuedTrack.videoId },
    ])

    expect(restored.queue).toHaveLength(1)
    expect(restored.history).toHaveLength(1)
    expect(restored.queue[0]).toMatchObject({
      videoId: queuedTrack.videoId,
      title: queuedTrack.title,
      addedAt: queuedTrack.addedAt,
    })
  })
})
