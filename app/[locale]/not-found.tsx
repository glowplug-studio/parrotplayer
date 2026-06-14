import { useTranslations } from "next-intl"

import { NotFoundContent } from "@/components/not-found-content"

export default function LocaleNotFound() {
  const t = useTranslations("NotFound")

  return (
    <NotFoundContent
      title={t("title")}
      description={t("description")}
      homeLabel={t("home")}
      aboutLabel={t("about")}
      languagesLabel={t("languages")}
    />
  )
}
