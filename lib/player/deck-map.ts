import type { DeckMap } from "@/lib/player/types"

export function createDeckMap<T>(value: T): DeckMap<T> {
  return { a: value, b: value }
}

export function createDeckListMap<T>(): DeckMap<T[]> {
  return { a: [], b: [] }
}
