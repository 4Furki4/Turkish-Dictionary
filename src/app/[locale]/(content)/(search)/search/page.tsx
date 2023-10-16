import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";
import React from "react";
import { Word } from "@/types";
import dynamic from "next/dynamic";
const WordCard = dynamic(() => import("@/components/customs/WordCard"), {
  ssr: false,
}); // if the first searched word is not found, this will reduce bundle size by not importing WordCard component.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const word = searchParams.word as string;
  if (word) {
    const parsedWord = decodeURIComponent(word); // parse the word to utf-8 format string
    const response = await api.word.getWord.query(parsedWord);
    return {
      title: parsedWord,
      description: response[0]?.meanings[0].partOfSpeech,
    };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (searchParams.word === undefined) return redirect("/"); // redirect to home page if no word param is provided
  const parsedWord = decodeURIComponent(searchParams.word as string);
  if (!parsedWord) {
    // redirect to home page if word param is empty
    redirect("/");
  }
  const response: Word[] = await api.word.getWord.query(parsedWord);
  if (response.length === 0) {
    // if no word is found, render this
    return (
      <div>
        <h1>{parsedWord}</h1>
        <p>Word not found</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-4 px-4 max-w-5xl xl:p-0 mx-auto">
      {response.map((word) => (
        <WordCard key={word.id} word={word} />
      ))}
    </main>
  );
}
