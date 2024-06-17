import React, { Suspense } from 'react'
import { api } from '@/src/trpc/server'
import WordCard from '@/src/components/customs/WordCard'
import { db } from '@/db';
import SearchResult from '@/src/_pages/search/SearchResult';
import Loading from '../_loading';
import { Metadata } from 'next';

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params: { word, locale }
}: {
    params: { word: string, locale: string }
}) {
    const parsedWord = decodeURIComponent(word).split('-').join(' ') // parse the word to utf-8 format string
    const response = await api.word.getWord(parsedWord);
    const defString = response[0].word_data.meanings.map((meaning, idx) => {
        return `${idx + 1}. ${meaning.meaning}:`
    }).join(" ")
    if (word) {
        const meta: Metadata = {
            title: locale === "en" ? `${parsedWord}` : `${parsedWord}`,
            description: locale === "en" ? `${parsedWord} definition: ${defString}` : `${parsedWord} kelimesinin anlamı: ${defString}`,
            keywords: `${parsedWord}, ${parsedWord} ne demek, ${parsedWord} anlamı`
        }

        return meta;
    }
}

export async function generateStaticParams() {
    const data = await db.query.words.findMany({
        columns: {
            name: true
        }
    })
    return data.map((word) => ({ word: word.name.split(" ").join("-") }))
}

export default function SearchResultPage({
    params: { locale, word }
}: {
    params: { locale: string, word: string }

}) {
    const formattedWord = decodeURI(word).trim().split("-").join(" ")
    return (
        <section className="flex flex-col gap-4 px-6 max-w-7xl mx-auto">
            <Suspense fallback={<Loading />}>
                <SearchResult word={formattedWord} locale={locale as "en" | "tr"} />
            </Suspense>
        </section>
    )

}
