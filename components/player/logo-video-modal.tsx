"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"

type LogoVideoModalProps = {
  isOpen: boolean
  onClose: () => void
}

const LOGO_VIDEO_ID = "jK2--Zu8f7g"

export function LogoVideoModal({ isOpen, onClose }: LogoVideoModalProps) {
  const t = useTranslations("LogoVideo")
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex min-w-[375px] items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-video-modal-title"
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-2 top-2 z-10 rounded-md bg-black/70 px-2 py-1 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          {t("close")}
        </button>
        <div className="aspect-video">
          <h2 id="logo-video-modal-title" className="sr-only">
            {t("title")}
          </h2>
          <iframe
            title={t("title")}
            src={`https://www.youtube.com/embed/${LOGO_VIDEO_ID}?autoplay=1&playsinline=1&rel=0`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
