import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Params } from "next/dist/server/request/params";
import React from "react";
import Hero from "@/src/components/hero";
import { api } from "@/src/trpc/server";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: {
      template: `${locale === "en" ? "%s | Turkish Meaning - Turkish Dictionary" : "%s | Anlamı - Türkçe Sözlük"}`,
      default: locale === "en" ? "Turkish Dictionary - Words, Definitions and Examples" : "Türkçe Sözlük - Kelimeler, Anlamları ve Örnek Cümleler",
    },
  };
}

export default async function SearchLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<Params>
}) {
  const { locale } = await params
  setRequestLocale(locale as string)
  const t = await getTranslations("Home");
  void api.word.getPopularWords.prefetch({ period: "allTime", limit: 6 })
  void api.word.getPopularWords.prefetch({ period: "last7Days", limit: 6 })
  void api.word.getPopularWords.prefetch({ period: "last30Days", limit: 6 })
  return (
    <Hero>
      {children}
    </Hero>
  );
}
