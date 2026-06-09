import { YouTubePlayerPage } from "@/components/player/youtube-player-page"

export default function Page() {
  return (
    <>
      <section className="sr-only" aria-label="About ParrotPlayer">
        <h1>Youtube Queue and Music Jukebox | ParrotPlayer</h1>
        <h2>YouTube music jukebox for bars, restaurants, and playlists on the fly</h2>
        <p>
          ParrotPlayer is a YouTube music jukebox for bars, restaurants, and building playlists on the fly, with
          vinyl-style playback, autoplay, crossfade, history, and local playlist memory.
        </p>
      </section>
      <YouTubePlayerPage />
    </>
  )
}
