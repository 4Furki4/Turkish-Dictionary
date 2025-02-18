import WordList from "@/src/_pages/Dashboard/WordList/WordList";
import { api, HydrateClient } from "@/src/trpc/server";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
  robots: {
    follow: false,
    index: false,
    googleBot: {
      follow: false,
      index: false,
    },
  },
};

export default async function Page(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  void api.word.getWords.prefetch({
    take: 10,
    skip: 0
  })
  void api.word.getWordCount.prefetch()
  void api.params.getLanguages.prefetch()
  void api.params.getPartOfSpeeches.prefetch()
  return (
    <HydrateClient>
      <WordList />
    </HydrateClient>
  );
}
