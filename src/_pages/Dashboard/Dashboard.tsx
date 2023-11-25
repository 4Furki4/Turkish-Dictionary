"use client";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import React from "react";
import UserList from "./UserList";
import WordList from "./WordList";
import WordRequestList from "./WordRequestList";
import { Word } from "@/types";
import { api } from "@/src/trpc/react";
import { SelectWord } from "@/db/schema";

export default function Dashboard({ words }: { words: SelectWord[] }) {
  const wordsQuery = api.word.getWords.useQuery(
    {},
    {
      initialData: words,
    }
  );
  return (
    <Card className="max-w-5xl mx-auto my-4">
      <CardHeader>
        <h1 className="text-fs-3 font-bold text-center">Dashboard</h1>
      </CardHeader>
      <CardBody>
        <WordList words={words} />
        <UserList />
        <WordRequestList />
      </CardBody>
    </Card>
  );
}
