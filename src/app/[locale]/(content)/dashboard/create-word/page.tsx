import CreateWord from "@/src/_pages/Dashboard/CreateWord";
import { api } from "@/src/trpc/server";
import React from "react";

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const meaningAttributes = await api.admin.getMeaningAttributes.query()
  return <CreateWord locale={locale} meaningAttributes={meaningAttributes} />;
}
