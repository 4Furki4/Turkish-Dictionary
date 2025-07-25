import React from "react";
import { api, HydrateClient } from "../../trpc/server";
import { auth } from "@/src/server/auth/auth";
import WordCardWrapper from "@/src/components/customs/word-card-wrapper";

export default async function SearchResult({ word, locale }: { word: string, locale: "en" | "tr" }) {
  void api.word.getWord.prefetch({ name: word, skipLogging: true })
  const session = await auth()

  return (
    <HydrateClient>
      <WordCardWrapper data={[]} session={session} locale={locale} />
    </HydrateClient>
  )
}
