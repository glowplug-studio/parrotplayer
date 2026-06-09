import type { DeckId } from "@/lib/player/types"

export const DECK_IDS: DeckId[] = ["a", "b"]
export const DEFAULT_OVERLAP = "4s"
export const FULL_PLAYER_WIDTH = "100%"
export const HIDDEN_PLAYER_WIDTH = "0%"
export const SPLIT_PLAYER_WIDTH = "calc(50% - 0.5rem)"
export const PLAYER_COLUMN_GAP = "1rem"
export const PLAYER_PANEL_TRANSITION_MS = 700
export const PLAYER_GAP_TRANSITION_CLASS = "transition-[column-gap] duration-700 ease-in-out"
export const PLAYER_WIDTH_TRANSITION_CLASS =
  "overflow-hidden transition-[width] duration-700 ease-in-out will-change-[width]"
export const PLAYER_SINGLE_PANEL_CLASS = "flex flex-1"
export const PLAYER_SETTLE_DELAY_MS = 120
export const PLAYER_PANEL_TRANSITION =
  `flex-basis ${PLAYER_PANEL_TRANSITION_MS}ms ease-in-out, ` +
  `max-width ${PLAYER_PANEL_TRANSITION_MS}ms ease-in-out, ` +
  `transform ${PLAYER_PANEL_TRANSITION_MS}ms ease-in-out, ` +
  `padding-left ${PLAYER_PANEL_TRANSITION_MS}ms ease-in-out`
export const BACKGROUND_FADE_MS = 2000
export const BACKGROUND_LAYER_OPACITY = 0.3
export const PROGRESS_POLL_MS = 100
export const TRACK_END_PLAY_DELAY_MS = 100
export const MIN_DECK_VOLUME = 0
export const MAX_DECK_VOLUME = 100
export const PREBUFFER_STATE_SETTLE_MS = 300
export const PREBUFFER_FINALIZE_DELAYS_MS = [900, 1800, 3200] as const
export const PLAY_RETRY_DELAYS_MS = [250, 750, 1500, 3000, 5000] as const
export const MUTED_PLAY_RETRY_DELAYS_MS = [1000, 2500, 5000] as const
export const METADATA_DURATION_RETRY_DELAY_MS = 500
export const METADATA_DURATION_MAX_RETRIES = 8
export const TOAST_AUTO_CLOSE_MS = 2500
export const TRACK_ADDED_TOAST_ID = "track-added-toast"
export const OUTGOING_FADE_WINDOW_MULTIPLIER = 1.25
export const VISUAL_TRANSITION_LEAD_SECONDS = 5
export const NO_OVERLAP_PULSE_LEAD_SECONDS = 8
export const OVERLAP_PULSE_EXTRA_SECONDS = 10
