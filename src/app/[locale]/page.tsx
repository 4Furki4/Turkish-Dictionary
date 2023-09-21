"use client";

import { useTranslations } from "next-intl";
import Link from "next-intl/link";
import { trpc } from "../_trpc/client";

export default function Index() {
  const t = useTranslations("Index");
  const words = trpc.getWords.useQuery();
  if (!words.data) {
    console.log("loading");
  }
  console.log(words.data);
  return (
    <div>
      <h1>{t("title")}</h1>
      <Link href={"protected"}>Protected</Link>
    </div>
  );
}
