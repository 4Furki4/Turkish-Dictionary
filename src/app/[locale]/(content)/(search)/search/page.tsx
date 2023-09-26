import { serverClient } from "@/app/_trpc/serverClient";
import { redirect } from "next/navigation";
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
  if (searchParams.word === undefined) return redirect("/"); // redirect to home page if no word is provided
  const parsedWord = decodeURIComponent(searchParams.word as string);
  if (!parsedWord) {
    // redirect to home page if word is empty
    redirect("/");
  }
  const response = await serverClient.getWord(parsedWord);
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
    <div>
      <h1>{parsedWord}</h1>
      <pre>
        <code>{JSON.stringify(response, null, 2)}</code>
      </pre>
    </div>
  );
}
