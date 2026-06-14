import { getTranslations, setRequestLocale } from "next-intl/server"

import { YouTubePlayerPage } from "@/components/player/youtube-player-page"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Seo")

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ParrotPlayer",
    applicationCategory: "MusicApplication",
    operatingSystem: "Web",
    description: t("jsonLdDescription"),
    featureList: [
      t("featureQueue"),
      t("featureDragDrop"),
      t("featureAutoplay"),
      t("featureCrossfade"),
      t("featureHistory"),
      t("featureMemory"),
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  return (
    <>
      <section className="sr-only" aria-label={t("headline")}>
        <h1>{t("headline")}</h1>
        <h2>{t("subheading")}</h2>
        <p>{t("description")}</p>
        <h2>{t("useCasesHeading")}</h2>
        <p>{t("useCases")}</p>
        <h2>{t("problemHeading")}</h2>
        <p>{t("problem")}</p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <YouTubePlayerPage />
    </>
  )
}
