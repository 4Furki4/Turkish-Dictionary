import WordCard from "@/src/components/customs/WordCard";
import { auth } from "@/src/server/auth/auth";
import { api } from "@/src/trpc/server";
import { Metadata } from "next";
import { Params } from "next/dist/server/request/params";
import { redirect, RedirectType } from "next/navigation";
import React from "react";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Saved Words" : "Kaydedilen Kelimeler",
    description: locale === "en" ? "You can see your saved words here." : "Buradan kaydedilen kelimelerinizi görebilirsiniz."
  }
}

export default async function SavedWords(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;
  const session = await auth();
  if (!session) redirect("/signin", RedirectType.replace);
  const savedWords = await api.user.getSavedWords();
  return (
    <section className="max-w-5xl mx-auto grid gap-5 mt-5">
      {savedWords.length > 0 ? savedWords?.map((word) => (
        <WordCard
          session={session}
          locale={locale as "en" | "tr"}
          key={word.word_data.word_id}
          word={word}
        />
      )) : <div>No saved words yet</div>}
    </section>
  );
}
