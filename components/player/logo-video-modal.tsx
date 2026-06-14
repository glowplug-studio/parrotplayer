"use client"

type LogoVideoModalProps = {
  isOpen: boolean
  onClose: () => void
}

const LOGO_VIDEO_ID = "jK2--Zu8f7g"

export function LogoVideoModal({ isOpen, onClose }: LogoVideoModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex min-w-[375px] items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-md bg-black/70 px-2 py-1 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          Close
        </button>
        <div className="aspect-video">
          <iframe
            title="ParrotPlayer logo video"
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
