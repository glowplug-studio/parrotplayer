"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"

type HelpModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex min-w-[375px] items-center justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 shrink-0 text-xl font-bold">How to Use ParrotPlayer</h2>
        <div className="dark-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>1. Open ParrotPlayer in one browser window at one side of the screen</p>
            <p>2. Open YouTube in another browser window on the other side of the screen and set its volume to 0</p>
            <p>3. Search for the videos you want to play in the YouTube window</p>
            <p>4. Drag the YouTube title from the search browser window into this window&apos;s playlist</p>
            <p>5. Or copy and paste a YouTube URL into the URL field on this window</p>
            <p>6. Manage your queue using drag and drop or the arrow buttons</p>
            <p>7. Enable autoplay to automatically play the next track</p>
            <p>8. Use overlap to crossfade between tracks</p>
            <p>9. Press the left and right arrow keys to skip 10s backward or forward</p>
            <p>10. Clear the queue and play history with the button below the Add button.</p>
          </div>

          <div className="my-6 space-y-3 text-muted-foreground">
            Click the ParrotPlayer text in the top left of the screen to set a custom name.
          </div>
          <div className="mt-4 rounded-lg bg-secondary/50 p-3">
            <p className="mb-3 text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Use these for an ad-free experience.
            </p>
            <div className="flex gap-2">
              <a
                href="https://brave.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Download Brave Browser"
              >
                <Image src="/brave-logo.svg" alt="Brave" width={20} height={20} className="h-5 w-5" />
                Brave
              </a>
              <a
                href="https://ublockorigin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Get uBlock Origin"
              >
                <span className="flex h-5 items-center justify-center rounded bg-white p-0.5">
                  <Image
                    src="/ublock-logo.svg"
                    alt="uBlock Origin"
                    width={20}
                    height={20}
                    className="h-5 w-auto px-1 py-0.5"
                  />
                </span>
                uBlock Origin
              </a>
            </div>
          </div>
        </div>
        <Button
          onClick={onClose}
          className="mt-6 w-full shrink-0"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Close help"
        >
          Got it
        </Button>
      </div>
    </div>
  )
}
