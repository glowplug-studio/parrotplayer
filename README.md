# Parrot Player

A Next.js YouTube jukebox with a vinyl-style player, queue/history management, autoplay, and overlap transitions.

## Package Manager

Use npm for this project. `package-lock.json` is the source of truth for dependency resolution.

## Commands

```bash
npm run dev
npm run lint
npm run format:check
npm test
npx tsc --noEmit
```

`npm run build` is available for production verification, but it is intentionally not part of the quick local quality loop.

## Architecture

The player keeps two permanent YouTube deck instances, deck A and deck B. Overlap playback prepares the inactive deck, slides it into the visual stage, starts playback at the configured overlap point, and then hands off active-deck state when the outgoing track ends.

Key modules:

- `components/player/youtube-player-page.tsx`: Orchestrates player state, queue actions, and YouTube deck events.
- `components/player/player-stage.tsx`: Renders the A/B deck stage, background layers, and transition layout.
- `hooks/player/use-background-crossfade.ts`: Owns the two-layer background crossfade state and cleanup.
- `hooks/player/use-single-toast.ts`: Replaces existing toast messages immediately instead of stacking them.
- `lib/player/playlist-storage.ts`: Pure serializer/restorer for localStorage playlist state.
- `lib/player/history.ts`: Pure history ordering and played-track upsert logic.
- `lib/player/youtube.ts`: YouTube video id extraction and storage keys.

## localStorage Shape

Playlist memory is stored under `parrotplayer-playlist` as an array:

```ts
type StoredPlaylistTrack = {
  status: "queued" | "history"
  videoId: string
  title: string
  thumbnail: string
  addedAt: number
}
```

Player settings are stored under `parrotplayer-settings`:

```ts
type StoredPlayerSettings = {
  autoplay: boolean
  overlap: "none" | "2s" | "4s" | "10s"
}
```

## Quality Gates

ESLint uses the official Next.js flat config for `core-web-vitals` and TypeScript. The project also runs Prettier, Vitest, and strict TypeScript checks with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, and `exactOptionalPropertyTypes`.

Husky and lint-staged run formatting and ESLint fixes on staged source files before commit.
