import { serverClient } from "@/app/_trpc/serverClient";
import React from "react";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const word = searchParams.word as string;
  if (word) {
    const parsedWord = decodeURIComponent(word); // parse the word to utf-8 format string
    const response = await serverClient.getWord(parsedWord);
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
  const parsedWord = decodeURIComponent(searchParams.word as string);
  const response = await serverClient.getWord(parsedWord);
  return (
    <div>
      <h1>{parsedWord}</h1>
      <pre>
        <code>{JSON.stringify(response, null, 2)}</code>
      </pre>
    </div>
  );
}
