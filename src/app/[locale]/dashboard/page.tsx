import WordList from "@/src/_pages/Dashboard/WordList/WordList";
import { api } from "@/src/trpc/server";
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

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const wordListPromise = api.word.getWords({
    take: 10,
    skip: 0
  })
  const wordCountPromise = api.word.getWordCount()
  const languagesPromise = api.admin.getLanguages()
  const partOfSpeechesPromise = api.admin.getPartOfSpeeches()
  const results = await Promise.allSettled([wordListPromise, wordCountPromise, languagesPromise, partOfSpeechesPromise])
  const wordList = results[0].status === "fulfilled" ? results[0].value : []
  const wordCount = results[1].status === "fulfilled" ? results[1].value : undefined
  const languages = results[2].status === "fulfilled" ? results[2].value : []
  const partOfSpeeches = results[3].status === "fulfilled" ? results[3].value.map(pos => ({
    ...pos,
    id: pos.id.toString()
  })) : []
  return (
    <WordList languages={languages} partOfSpeeches={partOfSpeeches} wordCount={wordCount} words={wordList} />
  );
}
