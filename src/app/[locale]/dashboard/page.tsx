import WordList from "@/src/_pages/dashboard/word-list/word-list";
import { api, HydrateClient } from "@/src/trpc/server";
import { Metadata } from "next";
import React from "react";
import { Card, CardBody } from "@heroui/react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
  robots: {
    follow: false,
    index: false,
    googleBot: {
      follow: false,
      index: false,
    },
  },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function Page(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: SearchParams;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const {
    locale
  } = params;

  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.per_page) || 10;

  void api.word.getWords.prefetch({
    take: perPage,
    skip: (page - 1) * perPage
  })
  void api.word.getWordCount.prefetch({})
  void api.params.getLanguages.prefetch()
  void api.params.getPartOfSpeeches.prefetch()

  return (
    <Card className="max-w-7xl w-full mx-auto my-4" radius="sm">
      <CardBody>
        <HydrateClient>
          <WordList />
        </HydrateClient>
      </CardBody>
    </Card>
  );
}
