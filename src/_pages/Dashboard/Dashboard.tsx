"use client";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import React from "react";
import UserList from "./UserList";
import WordList from "./WordList";
import WordRequestList from "./WordRequestList";
import { api } from "@/src/trpc/react";
import { Link } from "@/src/navigation";
import { SelectWord } from "@/db/schema/words";
import { SelectMeaning } from "@/db/schema/meanings";
import { Prettify } from "@/types";

type Words = Prettify<{
  // TODO: build a type for queried words
}>;

export default function Dashboard({
  words,
  locale,
}: {
  words: Words
  locale: string;
}) {
  // const wordsQuery = api.word.getWords.useQuery(
  //   {},
  //   {
  //     initialData: words,
  //   }
  // );
  return (
    <Card className="max-w-5xl mx-auto my-4">
      <CardHeader>
        <h1 className="text-fs-3 font-bold text-center">Dashboard</h1>
      </CardHeader>
      <CardBody>
        <Link href="/dashboard/create-word">Create Word</Link>
        <WordList />
        <UserList />
        <WordRequestList />
      </CardBody>
    </Card>
  );
}
