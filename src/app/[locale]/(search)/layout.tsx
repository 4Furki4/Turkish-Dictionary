import Search from "@/src/components/customs/Search";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import React from "react";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: {
      template: `${locale === "en" ? "%s | Turkish Meaning - Turkish Dictionary" : "%s | Anlamı - Türkçe Sözlük"}`,
      default: locale === "en" ? "Turkish Dictionary - Words, Definitions and Examples" : "Türkçe Sözlük - Kelimeler, Anlamları ve Örnek Cümleler"
    },
  };
}

export default async function SearchLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale)
  const t = await getTranslations("Home");
  return <Search warningParamIntl={t("alreadySignedIn")}>{children}</Search>;
}
