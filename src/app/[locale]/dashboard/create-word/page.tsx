import CreateWord from "@/src/_pages/Dashboard/CreateWord";
import { api } from "@/src/trpc/server";
import React from "react";

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const meaningAttributesPromise = api.admin.getMeaningAttributes()
  const authorsPromise = api.admin.getExampleSentenceAuthors()
  const partOfSpeechesPromise = api.admin.getPartOfSpeeches();
  const results = await Promise.allSettled([meaningAttributesPromise, authorsPromise, partOfSpeechesPromise])
  const meaningAttributes = results[0].status === "fulfilled" ? results[0].value : []
  const authors = results[1].status === "fulfilled" ? results[1].value.map((author) => ({
    ...author,
    id: author.id.toString(),
  })) : []
  const partOfSpeeches = results[2].status === "fulfilled" ? results[2].value : []

  return <CreateWord locale={locale} meaningAttributes={meaningAttributes} authors={authors} partOfSpeeches={partOfSpeeches} />;
}
