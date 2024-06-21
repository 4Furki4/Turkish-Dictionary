import React from "react";
import { api } from "../../trpc/server";
import WordCard from "../../components/customs/WordCard";

export default async function SearchResult({ word, locale }: { word: string, locale: "en" | "tr" }) {
  const response = await api.word.getWord(word)
  const isSavedWords = await Promise.all(response.map(async (word) => {
    try {
      const isSaved = await api.user.getWordSaveStatus(word.word_data.word_id)
      return { wordId: word.word_data.word_id, isSaved: isSaved }
    } catch (error) {
      return { wordId: word.word_data.word_id, isSaved: false }
    }

  }))
  return response.length > 0 ? (
    response.map((word) => <WordCard key={word.word_data.word_id} word={word} isSavedWord={isSavedWords.find((value) => value.wordId === word.word_data.word_id)!.isSaved} locale={locale} />)
  ) : (
    <>
      <h1 className="text-center text-fs-3">{word}</h1>
      <p className="text-center text-fs-3">Word not found!</p>
    </>
  );
}
