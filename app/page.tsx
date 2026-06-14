import { YouTubePlayerPage } from "@/components/player/youtube-player-page"

export default function Page() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ParrotPlayer",
    applicationCategory: "MusicApplication",
    operatingSystem: "Web",
    description:
      "A free YouTube queue player and music jukebox for bars, parties, restaurants, and playlists on the fly.",
    featureList: [
      "YouTube queue player",
      "Drag-and-drop YouTube links",
      "Autoplay",
      "Crossfade overlap controls",
      "Playlist history",
      "Local playlist memory",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  return (
    <>
      <section className="sr-only" aria-label="About ParrotPlayer">
        <h1>YouTube Queue Player and Music Jukebox | ParrotPlayer</h1>
        <h2>YouTube music jukebox for bars, parties, restaurants, and playlists on the fly</h2>
        <p>
          ParrotPlayer is a free YouTube queue player and music jukebox for bars, parties, restaurants, and building
          playlists on the fly, with autoplay, crossfade, history, drag-and-drop YouTube links, and local playlist
          memory.
        </p>
        <h2>Use cases</h2>
        <p>
          Use ParrotPlayer as a party jukebox player, bar music player, restaurant playlist tool, shop background music
          player, or a simple way to save a list of YouTube songs without opening YouTube and getting distracted.
        </p>
        <h2>The Problem</h2>
        <p>
          Bars and small venues often play music from YouTube, but managing tabs, queues, volume sliders, and
          overlapping tracks can interrupt the room. ParrotPlayer gives YouTube music a focused queue and player
          workflow.
        </p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <YouTubePlayerPage />
    </>
  )
}
