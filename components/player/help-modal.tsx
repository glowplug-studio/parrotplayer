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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card p-6 rounded-xl max-w-md mx-4 shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">How to Use Parrot Player</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>1. Open Parrot Player in one browser window at one side of the screen</p>
          <p>2. Open YouTube in another browser window and set its volume to 0</p>
          <p>3. Search for the videos you want to play</p>
          <p>4. Copy the URL from your YouTube window</p>
          <p>5. Paste it into the URL field below and click Add</p>
          <p>6. Manage your queue using drag and drop or the arrow buttons</p>
          <p>7. Enable autoplay to automatically play the next track</p>
          <p>8. Use overlap to crossfade between tracks</p>
        </div>
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            <strong className="text-foreground">Tip:</strong> Use these for an ad-free experience.
          </p>
          <div className="flex gap-2">
            <a
              href="https://brave.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Download Brave Browser"
            >
              <Image src="/brave-logo.svg" alt="Brave" width={20} height={20} className="h-5 w-5" />
              Brave
            </a>
            <a
              href="https://ublockorigin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Get uBlock Origin"
            >
              <span className="flex h-5 items-center justify-center rounded bg-white px-0.5">
                <Image src="/ublock-logo.svg" alt="uBlock Origin" width={20} height={20} className="h-5 w-auto" />
              </span>
              uBlock Origin
            </a>
          </div>
        </div>
        <Button
          onClick={onClose}
          className="w-full mt-6"
          data-tooltip-id="player-tooltip"
          data-tooltip-content="Close help"
        >
          Got it
        </Button>
      </div>
    </div>
  )
}
