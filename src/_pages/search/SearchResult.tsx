import React from "react";
import { api } from "../../trpc/server";
import WordCard from "../../components/customs/WordCard";
import { Link as NextIntlLink } from "@/src/navigation";
import { getTranslations } from "next-intl/server";

export default async function SearchResult({ word, locale }: { word: string, locale: "en" | "tr" }) {
  const t = await getTranslations('SearchResults')
  const response = await api.word.getWord(word)
  const isSavedWords = await Promise.all(response.map(async (word) => {
    try {
      const isSaved = await api.user.getWordSaveStatus(word.word_data.word_id)
      return { wordId: word.word_data.word_id, isSaved: isSaved }
    } catch (error) {
      return { wordId: word.word_data.word_id, isSaved: false }
    }

  }))
  return response.length > 0 ? (
    response.map((word) => <WordCard key={word.word_data.word_id} word={word} isSavedWord={isSavedWords.find((value) => value.wordId === word.word_data.word_id)!.isSaved} locale={locale} />)
  ) : (
    <>
      <h1 className="text-center text-fs-3">{word}</h1>
      <p className="text-center text-fs-3">
        {t('NoMeaningError')}
      </p>
      {/* TODO: change here when contact page is ready. */}
      <NextIntlLink href="/" locale={locale}>
        {t('Contact')}
      </NextIntlLink>
    </>
  );
}
