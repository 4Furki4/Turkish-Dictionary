import { Card, CardBody, CardHeader } from "@nextui-org/react";
import React from "react";
import UserList from "./UserList";
import WordList from "./WordList";
import WordRequestList from "./WordRequestList";
import { Link } from "@/src/navigation";
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
  // const wordsQuery = api.word.getWords.useQuery(
  //   {},
  //   {
  //     initialData: words,
  //   }
  // );
  const wordList = await api.word.getWords({
    take: 10,
    skip: 0
  })
  return (
    <Card className="max-w-7xl w-full mx-auto my-4" radius="sm">
      <CardHeader>
        <h1 className="text-fs-3 font-bold text-center">Dashboard</h1>
      </CardHeader>
      <CardBody>
        <WordList words={wordList} />
        <NextIntlLink href="/dashboard/create-word">Create Word</NextIntlLink>
        <UserList />
        <WordRequestList />
      </CardBody>
    </Card>
  );
}
