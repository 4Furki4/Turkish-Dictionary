import CreateWord from "@/src/_pages/Dashboard/CreateWord";
import React from "react";

export default function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <CreateWord locale={locale} />;
}
