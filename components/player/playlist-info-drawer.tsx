"use client"

import { useState } from "react"
import AnimateHeight from "react-animate-height"

type InfoPanel = "about" | "use-cases" | "release-notes" | null

const releaseDate = "June 14, 2026"

export function PlaylistInfoDrawer() {
  const [activePanel, setActivePanel] = useState<InfoPanel>(null)
  const isOpen = activePanel !== null

  const togglePanel = (panel: Exclude<InfoPanel, null>) => {
    setActivePanel((currentPanel) => (currentPanel === panel ? null : panel))
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-2">
        <AnimateHeight duration={320} height={isOpen ? "auto" : 0}>
          <div className="pointer-events-auto max-h-[calc(100dvh-21rem)] overflow-y-auto rounded-t-lg border border-border bg-card/95 p-4 text-sm shadow-2xl backdrop-blur-md dark-scrollbar">
            {activePanel === "about" ? <AboutContent /> : null}
            {activePanel === "use-cases" ? <UseCasesContent /> : null}
            {activePanel === "release-notes" ? <ReleaseNotesContent /> : null}
          </div>
        </AnimateHeight>
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 flex h-8 w-full max-w-2xl -translate-x-1/2 items-center border-t border-border bg-card/90 px-3 text-xs text-muted-foreground shadow-[0_-8px_20px_rgb(0_0_0/0.18)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <a
            href="#about"
            onClick={(event) => {
              event.preventDefault()
              togglePanel("about")
            }}
            className={`font-medium transition-colors hover:text-foreground ${
              activePanel === "about" ? "text-foreground" : ""
            }`}
          >
            About
          </a>
          <button
            type="button"
            onClick={() => togglePanel("use-cases")}
            className={`font-medium transition-colors hover:text-foreground ${
              activePanel === "use-cases" ? "text-foreground" : ""
            }`}
          >
            Use Cases
          </button>
        </div>
        <button
          type="button"
          onClick={() => togglePanel("release-notes")}
          className={`ml-auto rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground ${
            activePanel === "release-notes" ? "text-foreground" : ""
          }`}
        >
          v1.3
        </button>
      </div>
    </>
  )
}

function AboutContent() {
  return (
    <div className="space-y-5 text-muted-foreground">
      <section id="about" className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">About</h2>
        <p>
          ParrotPlayer started as a side project built for fun, curiosity, and a personal need: a simple YouTube music
          player that can queue songs quickly without turning a night of music into tab management. The idea is to add
          features in small layers, with each release making the app a little more useful while keeping it lightweight.
        </p>
        <p>
          If people find it useful, future versions could add playlist sharing, realtime sync between devices, and
          playlist export and import for moving a music queue between sessions, venues, or parties.
        </p>
      </section>

      <section id="use-cases" className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">The Problem</h2>
        <p>
          In bars, restaurants, and small venues around Thailand, music often comes from YouTube. That works until
          someone has to act as the YouTube DJ: juggling tabs, adjusting volume sliders between tracks, accidentally
          overlapping songs, losing the currently playing tab, or stopping the music while searching for the next song.
        </p>
        <p>
          ParrotPlayer is built around that real-world need. It gives YouTube music a queue, a player, history, overlap
          controls, and a cleaner workflow for keeping background music moving without losing the room.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Technology</h2>
        <p>
          ParrotPlayer was vibe coded with Codex, built with Next.js, and deployed on Vercel. The goal is to keep the
          stack inexpensive, fast, and easy to evolve release by release.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-bold text-foreground">Why a .site domain?</h3>
        <p>The .site domain keeps the project cheap to run, with the domain costing less than 2 USD per year.</p>
      </section>
    </div>
  )
}

function UseCasesContent() {
  return (
    <div className="space-y-5 text-muted-foreground">
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Use cases</h2>
        <p>
          As a party jukebox player, ParrotPlayer makes it easy to build a shared YouTube music queue on the fly. Add
          songs as people request them, keep the current track playing, and avoid switching back and forth between tabs
          while everyone waits.
        </p>
        <p>
          As a bar music player, it gives staff a practical way to line up songs for the room, keep a music history, and
          manage playback from one focused screen. It is useful for small venues that already rely on YouTube but need a
          cleaner queue and fewer interruptions.
        </p>
        <p>
          It also works as a simple way to save a list of YouTube songs without opening YouTube every time and getting
          distracted by recommendations. Build a queue, keep it local, and return to it later when you want music rather
          than another search session.
        </p>
        <p>
          Other uses include restaurant playlists, workout music, background music for a shop, rehearsal references, DJ
          warm-up lists, and any situation where a YouTube music player with queue control is more useful than a normal
          browser tab.
        </p>
      </section>
    </div>
  )
}

function ReleaseNotesContent() {
  return (
    <div className="space-y-3 text-muted-foreground">
      <h2 className="text-lg font-bold text-foreground">Release notes</h2>
      <p>
        <strong className="text-foreground">V1.3: {releaseDate}.</strong> Added the SVG logo, favicon set, WhatsApp
        share image, and social preview metadata.
      </p>
      <p>
        <strong className="text-foreground">V1.2: {releaseDate}.</strong> Added a loop list feature so music can stay in
        the queue, loop continuously, and still be recorded in history.
      </p>
      <p>
        <strong className="text-foreground">V1.1: {releaseDate}.</strong> Added drag-and-drop support for moving YouTube
        links from one browser window into the playlist for faster queue building, and updated the instructions to make
        the workflow clear.
      </p>
    </div>
  )
}
