import WordCard from "@/src/components/customs/WordCard";
import { api } from "@/src/trpc/server";
import React from "react";

export default async function SavedWords(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const savedWords = await api.user.getSavedWords();
  console.log("savedWords", savedWords.length)
  return (
    <section className="max-w-5xl mx-auto grid gap-5 mt-5">
      {savedWords.length > 0 ? savedWords?.map((word) => (
        <WordCard
          locale={locale as "en" | "tr"}
          key={word.word_data.word_id}
          word={word}
        />
      )) : <div>No saved words yet</div>}
    </section>
  );
}
