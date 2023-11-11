import React from "react";
import { api } from "../../trpc/server";
import { Word } from "@/types";
import WordCard from "../../components/customs/WordCard";

export default async function SearchResult({ word }: { word: string }) {
  const response: Word[] = await api.word.getWord.query(word);
  return response.length > 0 ? (
    response.map((word) => <WordCard key={word.id} word={word} />)
  ) : (
    <>
      <h1 className="text-center text-fs-3">{word}</h1>
      <p className="text-center text-fs-3">Word not found!</p>
    </>
  );
}
