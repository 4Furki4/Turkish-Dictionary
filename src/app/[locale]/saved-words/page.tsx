import WordCard from "@/src/components/customs/WordCard";
import { api } from "@/src/trpc/server";
import React from "react";

export default async function SavedWords() {
  const savedWords = await api.user.getSavedWords();
  return (
    <section className="max-w-5xl mx-auto grid gap-5 mt-5">
      {savedWords?.map((word) => (
        <WordCard key={word.word_data.word_id} word={word} />
      ))}
    </section>
  );
}
