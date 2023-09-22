"use client";
import { useTranslations } from "next-intl";
import Link from "next-intl/link";

export default function Index() {
  const t = useTranslations("Index");
  return (
    <div>
      <h1>{t("title")}</h1>
      <Link href={"protected"}>Protected</Link>
    </div>
  );
}
