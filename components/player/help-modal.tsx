"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

const HELP_VIDEO_ID = "CUlw20k2BkE"

type HelpModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const t = useTranslations("Help")

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
        <h2 className="mb-4 shrink-0 text-xl font-bold">{t("title")}</h2>
        <div className="dark-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="mb-5 aspect-video overflow-hidden rounded-lg border border-border bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${HELP_VIDEO_ID}?autoplay=1&playsinline=1&rel=0`}
              title={t("videoTitle")}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            {Array.from({ length: 10 }, (_, index) => (
              <p key={index}>{t(`step${index + 1}`)}</p>
            ))}
          </div>

          <div className="my-6 space-y-3 text-muted-foreground">{t("renameTip")}</div>
          <div className="mt-4 rounded-lg bg-secondary/50 p-3">
            <p className="mb-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{t("adFreeTipLabel")}</strong> {t("adFreeTip")}
            </p>
            <div className="flex gap-2">
              <a
                href="https://brave.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title={t("downloadBrave")}
              >
                <Image src="/brave-logo.svg" alt="Brave" width={20} height={20} className="h-5 w-5" />
                Brave
              </a>
              <a
                href="https://ublockorigin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title={t("getUblock")}
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
          data-tooltip-content={t("closeHelp")}
        >
          {t("gotIt")}
        </Button>
      </div>
    </div>
  )
}
