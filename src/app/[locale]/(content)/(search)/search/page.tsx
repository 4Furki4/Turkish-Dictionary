import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import Loading from "./loading";
import SearchResult from "@/src/_pages/search/SearchResult";
// if the first searched word is not found, this will reduce bundle size by not importing WordCard component.
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
      description: response[0]?.word_data.meanings.map((meaning) => meaning.meaning).join(", "),
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

  return (
    <section className="flex flex-col gap-4 px-6 max-w-5xl mx-auto">
      <Suspense key={parsedWord} fallback={<Loading />}>
        <SearchResult word={parsedWord} />
      </Suspense>
    </section>
  );
}
