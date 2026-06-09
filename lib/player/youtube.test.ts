import { describe, expect, it } from "vitest"

import { extractVideoId } from "@/lib/player/youtube"

describe("extractVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts %s", (input, expected) => {
    expect(extractVideoId(input)).toBe(expected)
  })

  it("returns null for invalid input", () => {
    expect(extractVideoId("https://example.com/nope")).toBeNull()
  })
})
