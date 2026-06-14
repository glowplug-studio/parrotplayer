import Link from "next/link"
import Image from "next/image"

import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages"

type NotFoundContentProps = {
  title: string
  description: string
  homeLabel: string
  aboutLabel: string
  languagesLabel: string
}

export function NotFoundContent({ title, description, homeLabel, aboutLabel, languagesLabel }: NotFoundContentProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md space-y-6 text-center">
        <Image
          src="/logo.svg"
          alt="ParrotPlayer"
          width={220}
          height={220}
          className="mx-auto h-auto w-full max-w-[220px] rounded-lg"
        />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {homeLabel}
          </Link>
          <Link
            href="/#about"
            className="rounded-full border border-border bg-secondary/70 px-4 py-2 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary"
          >
            {aboutLabel}
          </Link>
        </div>
        <nav aria-label={languagesLabel} className="flex flex-wrap justify-center gap-2">
          {LANGUAGE_OPTIONS.map((option) => (
            <Link
              key={option.locale}
              href={option.locale === "en" ? "/" : `/${option.locale}`}
              className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {option.locale.toUpperCase()}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  )
}
