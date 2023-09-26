import { serverClient } from "@/app/_trpc/serverClient";
import React from "react";

export async function generateMetadata({
  params: { word },
}: {
  params: { word: string };
}) {
  const parsedWord = decodeURIComponent(word); // parse the word to utf-8 format string
  const response = await serverClient.getWord(parsedWord);
  return {
    title: parsedWord,
    description: response[0]?.meanings[0].partOfSpeech,
  };
}

export default async function Page({
  params: { word },
}: {
  params: { word: string };
}) {
  const parsedWord = decodeURIComponent(word);
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
