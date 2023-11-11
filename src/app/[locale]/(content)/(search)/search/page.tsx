import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import { Word } from "@/types";
import dynamic from "next/dynamic";
import Loading from "./loading";
import SearchResult from "@/src/_pages/search/SearchResult";
const WordCard = dynamic(() => import("@/components/customs/WordCard"), {
  ssr: false,
  loading: () => <Loading />,
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

  return (
    <main className="flex flex-col gap-4 px-4 max-w-5xl xl:p-0 mx-auto">
      <Suspense key={parsedWord} fallback={<Loading />}>
        <SearchResult word={parsedWord} />
      </Suspense>
    </main>
  );
}
