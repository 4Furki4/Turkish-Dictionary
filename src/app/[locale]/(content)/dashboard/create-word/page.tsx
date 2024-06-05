import CreateWord from "@/src/_pages/Dashboard/CreateWord";
import { api } from "@/src/trpc/server";
import React from "react";

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const meaningAttributes = await api.admin.getMeaningAttributes()
  const authors = await api.admin.getExampleSentenceAuthors()
  const partOfSpeeches = await api.admin.getPartOfSpeeches();
  const wordAttributes = await api.admin.getWordAttributes();
  return <CreateWord locale={locale} meaningAttributes={meaningAttributes} authors={authors} partOfSpeeches={partOfSpeeches} wordAttributes={wordAttributes} />;
}
