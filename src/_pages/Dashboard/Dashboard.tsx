import { Card, CardBody, CardHeader } from "@nextui-org/react";
import React from "react";
import UserList from "./UserList";
import WordList from "./WordList/WordList";
import WordRequestList from "./WordRequestList";
import { Prettify } from "@/types";
import { Link as NextIntlLink } from "@/src/navigation";
import { api } from "@/src/trpc/server";
type Words = Prettify<{
  // TODO: build a type for queried words
}>;

export default async function Dashboard({
  locale,
}: {
  locale: string;
}) {
  const wordListPromise = api.word.getWords({
    take: 10,
    skip: 0
  })
  const wordCountPromise = api.word.getWordCount()
  const languagesPromise = api.admin.getLanguages()
  const results = await Promise.allSettled([wordListPromise, wordCountPromise, languagesPromise])
  const wordList = results[0].status === "fulfilled" ? results[0].value : []
  const wordCount = results[1].status === "fulfilled" ? results[1].value : undefined
  const languages = results[2].status === "fulfilled" ? results[2].value : []
  return (
    <Card className="max-w-7xl w-full mx-auto my-4" radius="sm">
      <CardHeader>
        <h1 className="text-fs-3 font-bold text-center">Dashboard</h1>
      </CardHeader>
      <CardBody>
        <WordList words={wordList} wordCount={wordCount} languages={languages} />
        <NextIntlLink href="/dashboard/create-word">Create Word</NextIntlLink>
        <UserList />
        <WordRequestList />
      </CardBody>
    </Card>
  );
}
